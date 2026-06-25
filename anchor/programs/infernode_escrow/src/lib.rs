use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Placeholder program id. Replace with your own (`anchor keys list`) before deploy.
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Minimum lifetime for a newly funded escrow, in seconds.
///
/// `refund` can only fire once `expires_at` has passed, so this floor guarantees
/// an assigned provider always has at least this long to finish before the buyer
/// can reclaim funds. Without it a buyer could set a past / near-instant
/// `expires_at` and refund out from under a provider who has already started the
/// job. Set generously above the longest expected job duration.
pub const MIN_ESCROW_SECONDS: i64 = 15 * 60; // 15 minutes

/// Minimum time that must still remain on an escrow when a provider is assigned,
/// in seconds. Guarantees an assigned provider always has at least this long to
/// finish before `refund` can fire, even if the job sat in the queue first.
pub const MIN_ASSIGN_REMAINING_SECONDS: i64 = 5 * 60; // 5 minutes

/// Canonical marketplace authority. Escrows may only be funded naming this key
/// as authority, and (via `has_one`) only this key can assign/release them.
/// REPLACE with your authority keypair's pubkey before `anchor build` (see README).
pub const MARKETPLACE_AUTHORITY: Pubkey =
    anchor_lang::solana_program::pubkey!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Canonical protocol treasury that receives the fee on release. Enforced
/// on-chain so a buyer cannot substitute their own treasury at funding time.
/// REPLACE with your treasury pubkey (matches VITE_TREASURY_WALLET) before build.
pub const PROTOCOL_TREASURY: Pubkey =
    anchor_lang::solana_program::pubkey!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// InferNode escrow.
///
/// Flow:
///  1. Buyer calls `initialize_escrow` with a 32-byte job id, the provider
///     payout amount and the protocol fee. Lamports (amount + fee) are moved
///     into the escrow PDA, which holds them on-chain.
///  2. The marketplace authority calls `assign_provider` once a provider claims
///     the job, recording the provider that will be paid.
///  3. On a verified result the authority calls `release`: the payout goes to the
///     provider, the fee to the treasury, and the escrow is closed.
///  4. If the job expires unfulfilled, anyone can call `refund` after
///     `expires_at`, returning all lamports to the buyer.
#[program]
pub mod infernode_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        job_id: [u8; 32],
        amount: u64,
        protocol_fee: u64,
        expires_at: i64,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);

        // Funds may only be escrowed against the canonical marketplace authority
        // and treasury, enforced on-chain so a buyer cannot substitute their own.
        require_keys_eq!(
            ctx.accounts.authority.key(),
            MARKETPLACE_AUTHORITY,
            EscrowError::Unauthorized
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            PROTOCOL_TREASURY,
            EscrowError::WrongTreasury
        );

        // Enforce a minimum escrow lifetime so a buyer cannot set a past /
        // near-instant `expires_at` and refund out from under a working provider.
        let now = Clock::get()?.unix_timestamp;
        let min_expiry = now
            .checked_add(MIN_ESCROW_SECONDS)
            .ok_or(EscrowError::MathOverflow)?;
        require!(expires_at >= min_expiry, EscrowError::ExpiryTooSoon);

        let total = amount
            .checked_add(protocol_fee)
            .ok_or(EscrowError::MathOverflow)?;

        // Move lamports from the buyer into the escrow PDA.
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                },
            ),
            total,
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.authority = ctx.accounts.authority.key();
        escrow.treasury = ctx.accounts.treasury.key();
        escrow.provider = Pubkey::default();
        escrow.job_id = job_id;
        escrow.amount = amount;
        escrow.protocol_fee = protocol_fee;
        escrow.expires_at = expires_at;
        escrow.status = EscrowStatus::Funded;
        escrow.bump = ctx.bumps.escrow;
        Ok(())
    }

    pub fn assign_provider(ctx: Context<AssignProvider>, provider: Pubkey) -> Result<()> {
        require!(provider != Pubkey::default(), EscrowError::InvalidProvider);
        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Funded, EscrowError::InvalidState);
        // Refuse to assign an escrow that is already expired or about to expire:
        // otherwise `refund` could fire immediately and strand the assigned
        // provider, who has just committed to doing the work, with no payout.
        let min_remaining = now
            .checked_add(MIN_ASSIGN_REMAINING_SECONDS)
            .ok_or(EscrowError::MathOverflow)?;
        require!(
            escrow.expires_at >= min_remaining,
            EscrowError::AssignWindowClosed
        );
        escrow.provider = provider;
        escrow.status = EscrowStatus::Assigned;
        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(
            escrow.status == EscrowStatus::Assigned,
            EscrowError::InvalidState
        );
        require_keys_eq!(
            ctx.accounts.provider.key(),
            escrow.provider,
            EscrowError::WrongProvider
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            escrow.treasury,
            EscrowError::WrongTreasury
        );

        // Pay the provider and the treasury directly from the PDA's lamports.
        // This is fund-custody code, so use checked math and an explicit balance
        // guard: an underflow must error, never wrap.
        let amount = escrow.amount;
        let fee = escrow.protocol_fee;
        let payout = amount.checked_add(fee).ok_or(EscrowError::MathOverflow)?;

        let escrow_ai = ctx.accounts.escrow.to_account_info();
        {
            let mut escrow_lamports = escrow_ai.try_borrow_mut_lamports()?;
            **escrow_lamports = (**escrow_lamports)
                .checked_sub(payout)
                .ok_or(EscrowError::InsufficientEscrowBalance)?;
        }
        {
            let mut provider_lamports = ctx.accounts.provider.try_borrow_mut_lamports()?;
            **provider_lamports = (**provider_lamports)
                .checked_add(amount)
                .ok_or(EscrowError::MathOverflow)?;
        }
        if fee > 0 {
            let mut treasury_lamports = ctx.accounts.treasury.try_borrow_mut_lamports()?;
            **treasury_lamports = (**treasury_lamports)
                .checked_add(fee)
                .ok_or(EscrowError::MathOverflow)?;
        }

        // Remaining rent lamports return to the buyer on close (see account attr).
        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Released;
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let clock = Clock::get()?;
        let escrow = &ctx.accounts.escrow;
        require!(
            escrow.status == EscrowStatus::Funded || escrow.status == EscrowStatus::Assigned,
            EscrowError::InvalidState
        );
        require!(
            clock.unix_timestamp >= escrow.expires_at,
            EscrowError::NotExpired
        );
        require_keys_eq!(
            ctx.accounts.buyer.key(),
            escrow.buyer,
            EscrowError::WrongBuyer
        );

        let refundable = escrow
            .amount
            .checked_add(escrow.protocol_fee)
            .ok_or(EscrowError::MathOverflow)?;

        let escrow_ai = ctx.accounts.escrow.to_account_info();
        {
            let mut escrow_lamports = escrow_ai.try_borrow_mut_lamports()?;
            **escrow_lamports = (**escrow_lamports)
                .checked_sub(refundable)
                .ok_or(EscrowError::InsufficientEscrowBalance)?;
        }
        {
            let mut buyer_lamports = ctx.accounts.buyer.try_borrow_mut_lamports()?;
            **buyer_lamports = (**buyer_lamports)
                .checked_add(refundable)
                .ok_or(EscrowError::MathOverflow)?;
        }

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Refunded;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(job_id: [u8; 32])]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: marketplace authority recorded for later release/assign.
    pub authority: UncheckedAccount<'info>,
    /// CHECK: protocol treasury that receives the fee on release.
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + JobEscrow::SIZE,
        seeds = [b"escrow", buyer.key().as_ref(), job_id.as_ref()],
        bump
    )]
    pub escrow: Account<'info, JobEscrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignProvider<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority @ EscrowError::Unauthorized,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.job_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, JobEscrow>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    pub authority: Signer<'info>,
    /// CHECK: validated against escrow.provider in the handler.
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    /// CHECK: validated against escrow.treasury in the handler.
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: receives reclaimed rent when the escrow account is closed.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,
    #[account(
        mut,
        has_one = authority @ EscrowError::Unauthorized,
        close = buyer,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.job_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, JobEscrow>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    /// CHECK: validated against escrow.buyer in the handler; receives rent on close.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,
    #[account(
        mut,
        close = buyer,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.job_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, JobEscrow>,
}

#[account]
pub struct JobEscrow {
    pub buyer: Pubkey,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub provider: Pubkey,
    pub job_id: [u8; 32],
    pub amount: u64,
    pub protocol_fee: u64,
    pub expires_at: i64,
    pub status: EscrowStatus,
    pub bump: u8,
}

impl JobEscrow {
    // 4 pubkeys (32) + job_id (32) + 2 u64 (16) + i64 (8) + status (1) + bump (1)
    pub const SIZE: usize = 32 * 4 + 32 + 8 + 8 + 8 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Funded,
    Assigned,
    Released,
    Refunded,
}

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Escrow is not in a valid state for this action")]
    InvalidState,
    #[msg("Caller is not the marketplace authority")]
    Unauthorized,
    #[msg("Provided provider does not match the assigned provider")]
    WrongProvider,
    #[msg("Provided treasury does not match the escrow treasury")]
    WrongTreasury,
    #[msg("Provided buyer does not match the escrow buyer")]
    WrongBuyer,
    #[msg("Escrow has not expired yet")]
    NotExpired,
    #[msg("Expiry is too soon; escrow must outlast the minimum job window")]
    ExpiryTooSoon,
    #[msg("Provider address is invalid")]
    InvalidProvider,
    #[msg("Escrow is expired or too close to expiry to assign a provider")]
    AssignWindowClosed,
    #[msg("Escrow PDA has insufficient lamports for this transfer")]
    InsufficientEscrowBalance,
}

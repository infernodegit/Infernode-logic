use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Placeholder program id. Replace with your own (`anchor keys list`) before deploy.
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Funded, EscrowError::InvalidState);
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
        let amount = escrow.amount;
        let fee = escrow.protocol_fee;

        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.provider.try_borrow_mut_lamports()? += amount;

        if fee > 0 {
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= fee;
            **ctx.accounts.treasury.try_borrow_mut_lamports()? += fee;
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

        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= refundable;
        **ctx.accounts.buyer.try_borrow_mut_lamports()? += refundable;

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
}

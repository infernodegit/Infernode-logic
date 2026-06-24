import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { SOLANA_CLUSTER } from "../../lib/solana-config";

export function clusterLabel(): string {
  return SOLANA_CLUSTER === "mainnet-beta"
    ? "Solana mainnet"
    : `Solana ${SOLANA_CLUSTER}`;
}

export function clusterBadge(): string {
  return SOLANA_CLUSTER === "mainnet-beta" ? "mainnet" : SOLANA_CLUSTER;
}

export function NetworkStatus() {
  const { connection } = useConnection();
  const [slot, setSlot] = useState<number | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval>;
    const poll = () => {
      connection
        .getSlot()
        .then((s) => {
          if (active) {
            setSlot(s);
            setOk(true);
          }
        })
        .catch(() => {
          if (active) setOk(false);
        });
    };
    poll();
    timer = setInterval(poll, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [connection]);

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Network
        </span>
        <span
          className={
            "inline-block h-1.5 w-1.5 rounded-full " +
            (ok === false ? "bg-destructive" : "bg-success")
          }
        />
      </div>
      <div className="mt-1 font-mono text-xs text-foreground">{clusterLabel()}</div>
      <div className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
        {slot !== null ? `slot ${slot.toLocaleString()}` : "connecting…"}
      </div>
    </div>
  );
}

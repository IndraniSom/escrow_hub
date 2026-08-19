import { useState, useEffect, useCallback } from "react";
import { connectWallet, isWalletAllowed, readNetwork } from "../lib/freighter";

export type WalletStatus = "idle" | "connecting" | "connected" | "error" | "disconnected";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "idle",
    address: null,
    network: null,
    error: null,
  });

  const updateState = (update: Partial<WalletState>) => {
    setState((prev) => ({ ...prev, ...update }));
  };

  const disconnect = useCallback(() => {
    localStorage.setItem("stellar-pay:disconnected", "true");
    updateState({
      status: "disconnected",
      address: null,
      network: null,
      error: null,
    });
  }, []);

  const connect = useCallback(async () => {
    try {
      updateState({ status: "connecting", error: null });
      const address = await connectWallet();
      const network = await readNetwork();
      localStorage.removeItem("stellar-pay:disconnected");
      
      updateState({
        status: "connected",
        address,
        network,
      });
    } catch (err) {
      updateState({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const disconnected = localStorage.getItem("stellar-pay:disconnected") === "true";
      await Promise.resolve();
      if (cancelled) return;
      if (disconnected) {
        updateState({ status: "disconnected" });
        return;
      }
      try {
        if (await isWalletAllowed()) {
          const address = await connectWallet();
          const network = await readNetwork();
          if (!cancelled) updateState({ status: "connected", address, network });
        }
      } catch {
        // Ignore errors on silent restore
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "connected" && state.status !== "idle") return;

    const interval = setInterval(async () => {
      if (localStorage.getItem("stellar-pay:disconnected") === "true") {
        return;
      }
      try {
        if (await isWalletAllowed()) {
          const address = await connectWallet();
          const network = await readNetwork();
          if (address !== state.address || network !== state.network) {
            updateState({
              status: "connected",
              address,
              network,
            });
          }
        }
      } catch {
        // Silently fail the poll
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [state.status, state.address, state.network]);

  return {
    ...state,
    connect,
    disconnect,
  };
}

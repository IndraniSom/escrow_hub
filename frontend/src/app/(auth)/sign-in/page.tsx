"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiClient, normalizeSignedMessage } from "@/lib/api";
import { useWalletContext } from "@/context/WalletProvider";
import { signMessage } from "@/lib/freighter";

export default function SignInPage() {
  const router = useRouter();
  const api = getApiClient();
  const wallet = useWalletContext();
  
  const [authState, setAuthState] = useState<"idle" | "signing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const displayError = error ?? wallet.error;

  async function connectWallet() {
    setError(null);
    await wallet.connect();
  }

  async function handleSignIn() {
    if (!wallet.address) return;
    setAuthState("signing");
    setError(null);
    try {
      const challengeRes = await api.auth.challenge(wallet.address);
      const signatureStr = await signMessage(challengeRes.challenge, wallet.address);
      const signature = normalizeSignedMessage(signatureStr);
      // Omit role from verify call
      const verifyRes = await api.auth.verify(wallet.address, signature, challengeRes.challenge);
      api.setToken(verifyRes.accessToken);
      localStorage.setItem("stellar_address", wallet.address);
      // Route directly to dashboard since onboarding is skipped
      router.push("/dashboard");
    } catch (e) {
      setAuthState("error");
      setError(e instanceof Error ? e.message : "Authentication failed");
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-600 flex items-center justify-center font-bold text-white">
            <span className="font-display text-lg">E</span>
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-white uppercase tracking-widest">
            Escrow<span className="text-orange-600">Hub</span>
          </span>
        </div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Sign In</h1>
        <p className="text-[#a1a1aa] text-sm mt-2">Connect your Stellar wallet to access the platform</p>
      </div>

      {/* Main Action Area */}
      <div className="border-struct bg-[#111113] p-8 space-y-6">
        {(wallet.status === "idle" || wallet.status === "disconnected") && (
          <div className="space-y-4">
            <div className="border border-[#27272a] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#27272a] flex items-center justify-center">
                  <span className="text-sm">🌟</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Freighter</p>
                  <p className="text-xs text-[#a1a1aa]">Recommended Stellar wallet</p>
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 font-bold">Official</span>
              </div>
            </div>
            <button
              onClick={connectWallet}
              className="w-full btn-primary py-4 text-sm"
            >
              Connect Freighter Wallet
            </button>
            <p className="text-center text-xs text-[#a1a1aa]">
              Don&apos;t have Freighter?{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                Install it here →
              </a>
            </p>
          </div>
        )}

        {wallet.status === "connecting" && (
          <div className="text-center py-4 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#a1a1aa] uppercase tracking-widest">Waiting for Freighter...</p>
          </div>
        )}

        {wallet.status === "connected" && wallet.address && (
          <div className="space-y-6">
            <div className="border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <p className="text-xs uppercase tracking-widest text-green-500 font-bold mb-1">Wallet Connected</p>
                <p className="text-sm font-mono text-white truncate max-w-[200px] sm:max-w-xs">{wallet.address}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignIn}
              disabled={authState === "signing"}
              className="block w-full btn-primary text-center py-4 disabled:opacity-50"
            >
              {authState === "signing" ? "Signing Message..." : "Sign Message to Enter →"}
            </button>
          </div>
        )}

        {wallet.status === "error" && displayError && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-red-400 font-bold">Connection Failed</p>
            <p className="text-sm text-[#a1a1aa]">{displayError}</p>
            <button
              onClick={() => { wallet.disconnect(); setError(null); }}
              className="btn-outline text-sm py-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[#52525b]">
        By connecting, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}

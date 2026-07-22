"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiClient } from "@/lib/api";

type WalletState = "idle" | "connecting" | "connected" | "error";
type Role = "client" | "freelancer" | null;

export default function SignInPage() {
  const router = useRouter();
  const api = getApiClient();
  const [walletState, setWalletState] = useState<WalletState>("idle");
  const [authState, setAuthState] = useState<"idle" | "signing" | "error">("idle");
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    setWalletState("connecting");
    setError(null);
    try {
      const freighterApi = (window as any).freighterApi;
      if (!freighterApi) throw new Error("Freighter not found");
      const publicKey = await freighterApi.getPublicKey();
      if (!publicKey) throw new Error("No public key returned");
      setAddress(publicKey);
      setWalletState("connected");
      setStep(2);
    } catch (e) {
      setWalletState("error");
      setError((e instanceof Error ? e.message : "Failed to connect.") + " Make sure Freighter is installed and unlocked.");
    }
  }

  async function handleEnter() {
    if (!address || !role) return;
    setAuthState("signing");
    setError(null);
    try {
      const challengeRes = await api.auth.challenge(address);
      const freighterApi = (window as any).freighterApi;
      if (!freighterApi) throw new Error("Freighter not found");
      const signedXdr = await freighterApi.signTransaction(
        challengeRes.transactionXdr,
        { networkPassphrase: "Test SDF Network ; September 2015" },
      );
      const verifyRes = await api.auth.verify(address, signedXdr, challengeRes.challenge);
      api.setToken(verifyRes.token);
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

      {/* Step 1: Connect Wallet */}
      <div className={`border-struct bg-[#111113] p-8 space-y-6 ${step === 2 ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 border flex items-center justify-center text-xs font-bold ${step >= 1 ? "border-orange-600 text-orange-600" : "border-[#27272a] text-[#a1a1aa]"}`}>1</span>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Connect Stellar Wallet</h2>
        </div>

        {walletState === "idle" && (
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
              Don't have Freighter?{" "}
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

        {walletState === "connecting" && (
          <div className="text-center py-4 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#a1a1aa] uppercase tracking-widest">Waiting for Freighter...</p>
          </div>
        )}

        {walletState === "connected" && address && (
          <div className="border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-green-500 font-bold mb-1">Wallet Connected</p>
              <p className="text-sm font-mono text-white">{address}</p>
            </div>
          </div>
        )}

        {walletState === "error" && error && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-red-400 font-bold">Connection Failed</p>
            <p className="text-sm text-[#a1a1aa]">{error}</p>
            <button
              onClick={() => { setWalletState("idle"); setError(null); }}
              className="btn-outline text-sm py-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Select Role */}
      <div className={`border-struct bg-[#111113] p-8 space-y-6 transition-opacity ${step === 1 ? "opacity-40 pointer-events-none select-none" : ""}`}>
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 border flex items-center justify-center text-xs font-bold ${step === 2 ? "border-orange-600 text-orange-600" : "border-[#27272a] text-[#a1a1aa]"}`}>2</span>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Select Your Role</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(["client", "freelancer"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`p-4 border text-left transition-all ${role === r ? "border-orange-600 bg-orange-600/5" : "border-[#27272a] hover:border-[#52525b]"}`}
            >
              <div className="text-lg mb-2">{r === "client" ? "👔" : "💻"}</div>
              <p className="text-sm font-bold uppercase tracking-widest text-white">
                {r === "client" ? "Client" : "Freelancer"}
              </p>
              <p className="text-xs text-[#a1a1aa] mt-1">
                {r === "client" ? "Post & fund projects" : "Find & complete work"}
              </p>
            </button>
          ))}
        </div>

        {role && (
          <button
            onClick={handleEnter}
            disabled={authState === "signing"}
            className="block w-full btn-primary text-center py-4 disabled:opacity-50"
          >
            {authState === "signing" ? "Signing in..." : `Enter as ${role === "client" ? "Client" : "Freelancer"} →`}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-[#52525b]">
        By connecting, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}

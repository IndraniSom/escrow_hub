import {
  isConnected,
  requestAccess,
  getNetworkDetails,
  signMessage as freighterSignMessage,
  signTransaction as freighterSignTransaction,
  isAllowed
} from "@stellar/freighter-api";

export class FreighterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FreighterError";
  }
}

function toFreighterError(err: unknown, fallback: string): FreighterError {
  if (err instanceof Error) return new FreighterError(err.message);
  if (err && typeof err === "object" && "message" in err) {
    return new FreighterError(String((err as { message: unknown }).message));
  }
  return new FreighterError(fallback);
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function connectWallet(): Promise<string> {
  if (!(await isConnected())) {
    throw new FreighterError("Freighter wallet is not installed or locked.");
  }

  try {
    const address = await requestAccess();
    if (address.error) throw new FreighterError(address.error.message);
    return address.address;
  } catch (err) {
    throw toFreighterError(err, "Failed to connect to Freighter");
  }
}

export async function isWalletAllowed(): Promise<boolean> {
  if (!(await isConnected())) return false;
  const res = await isAllowed();
  if (res.error) throw new FreighterError(res.error.message);
  return res.isAllowed;
}

export async function readNetwork(): Promise<string> {
  if (!(await isConnected())) return "";
  try {
    const details = await getNetworkDetails();
    if (details.error) throw new FreighterError(details.error.message);
    return details.network || "";
  } catch {
    return "";
  }
}

export async function signMessage(message: string, address: string): Promise<string> {
  try {
    const res = await freighterSignMessage(message, { address });
    if (res.error) throw new FreighterError(res.error.message);
    if (!res.signedMessage) throw new FreighterError("Freighter returned no signature");
    return typeof res.signedMessage === "string"
      ? res.signedMessage
      : bufferToBase64(res.signedMessage);
  } catch (err) {
    throw toFreighterError(err, "Failed to sign message");
  }
}

export async function signTransaction(xdr: string, networkPassphrase?: string): Promise<string> {
  try {
    const opts = networkPassphrase ? { networkPassphrase } : undefined;
    const signed = await freighterSignTransaction(xdr, opts);
    if (signed.error) throw new FreighterError(signed.error.message);
    return signed.signedTxXdr;
  } catch (err) {
    throw toFreighterError(err, "Failed to sign transaction");
  }
}
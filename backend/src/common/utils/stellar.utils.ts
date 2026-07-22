import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

export function verifyWalletSignature(
  challenge: string,
  signature: string,
  publicKey: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    return keypair.verify(
      Buffer.from(challenge, 'utf-8'),
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}

export function generateAuthChallenge(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getNetworkPassphrase(): string {
  const network = process.env.STELLAR_NETWORK || 'TESTNET';
  if (network === 'PUBLIC' || network === 'MAINNET') {
    return 'Public Global Stellar Network ; September 2015';
  }
  return 'Test SDF Network ; quetzalcoatl';
}

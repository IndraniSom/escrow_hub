import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

const STELLAR_SIGNED_MESSAGE_PREFIX = 'Stellar Signed Message:\n';

export function verifyWalletSignature(
  challenge: string,
  signature: string,
  publicKey: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    const encodedMessage = Buffer.from(
      STELLAR_SIGNED_MESSAGE_PREFIX + challenge,
      'utf-8',
    );
    const messageHash = crypto.createHash('sha256').update(encodedMessage).digest();
    return keypair.verify(messageHash, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

export function signWalletMessage(
  seed: string,
  message: string,
): string {
  const keypair = Keypair.fromSecret(seed);
  const encodedMessage = Buffer.from(
    STELLAR_SIGNED_MESSAGE_PREFIX + message,
    'utf-8',
  );
  const messageHash = crypto.createHash('sha256').update(encodedMessage).digest();
  return keypair.sign(messageHash).toString('base64');
}

export function generateAuthChallenge(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getNetworkPassphrase(): string {
  const network = process.env.STELLAR_NETWORK || 'TESTNET';
  if (network === 'PUBLIC' || network === 'MAINNET') {
    return 'Public Global Stellar Network ; September 2015';
  }
  return 'Test SDF Network ; September 2015';
}

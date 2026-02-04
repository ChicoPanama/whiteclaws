import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

export function generateKeyPair() {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    secretKey: naclUtil.encodeBase64(keypair.secretKey),
  };
}

export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderSecretKey: string
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = naclUtil.decodeUTF8(message);
  const pubKeyUint8 = naclUtil.decodeBase64(recipientPublicKey);
  const secretKeyUint8 = naclUtil.decodeBase64(senderSecretKey);

  const encrypted = nacl.box(messageUint8, nonce, pubKeyUint8, secretKeyUint8);

  return {
    ciphertext: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce),
  };
}

export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: string,
  recipientSecretKey: string
): string | null {
  const cipherUint8 = naclUtil.decodeBase64(ciphertext);
  const nonceUint8 = naclUtil.decodeBase64(nonce);
  const pubKeyUint8 = naclUtil.decodeBase64(senderPublicKey);
  const secretKeyUint8 = naclUtil.decodeBase64(recipientSecretKey);

  const decrypted = nacl.box.open(
    cipherUint8,
    nonceUint8,
    pubKeyUint8,
    secretKeyUint8
  );

  if (!decrypted) return null;
  return naclUtil.encodeUTF8(decrypted);
}

export function generateSharedSecret(
  publicKey: string,
  secretKey: string
): string {
  const pubKeyUint8 = naclUtil.decodeBase64(publicKey);
  const secretKeyUint8 = naclUtil.decodeBase64(secretKey);
  const shared = nacl.box.before(pubKeyUint8, secretKeyUint8);
  return naclUtil.encodeBase64(shared);
}

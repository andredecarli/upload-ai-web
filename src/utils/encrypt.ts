import nacl from 'tweetnacl'
import util from 'tweetnacl-util'

export function encodeMessage(
  receiverPublicKey: string,
  message: string,
) {
  const ephemeralKeyPair = nacl.box.keyPair()
  const pubKeyUInt8Array = util.decodeBase64(receiverPublicKey)
  const messageUInt8Array = util.decodeUTF8(message)
  const nonceUInt8Array = nacl.randomBytes(nacl.box.nonceLength)

  const encryptedMessageUInt8Array = nacl.box(messageUInt8Array, nonceUInt8Array, pubKeyUInt8Array, ephemeralKeyPair.secretKey)
  const encryptedMessage = util.encodeBase64(encryptedMessageUInt8Array)
  const ephemPubKey = util.encodeBase64(ephemeralKeyPair.publicKey)
  const nonce = util.encodeBase64(nonceUInt8Array)

  return { ephemPubKey, encryptedMessage, nonce }
}


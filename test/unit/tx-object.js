/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
import { describe, it } from 'mocha'
import { expect } from 'chai'
import TxObject from '../../src/tx/tx-object'
import { TX_TYPE } from '../../src/tx/builder/schema'
import { generateKeyPair } from '../../src/utils/crypto'
import MemoryAccount from '../../src/account/memory'

describe('TxObject', () => {
  const keyPair = generateKeyPair()
  let txObject
  let signedTx

  describe('Invalid initialization', () => {
    it('Empty arguments', () => {
      expect(() => TxObject()).to.throw('Invalid TxObject arguments. Please provide one of { tx: "tx_asdasd23..." } or { type: "spendTx", params: {...} }')
    })

    it('Invalid "params"', () => {
      expect(() => TxObject({ params: true, type: TX_TYPE.spend })).to.throw('"params" should be an object')
    })

    it('Invalid "type"', () => {
      expect(() => TxObject({ params: {}, type: 1 })).to.throw('Unknown transaction type 1')
    })

    it('Not enough arguments', () => {
      expect(() => TxObject({ params: { senderId: 'ak_123', amount: 1 }, type: TX_TYPE.spend }))
        .to.throw('Transaction build error')
    })
  })

  describe('Init TxObject', () => {
    it('Build transaction', async () => {
      txObject = TxObject({
        type: TX_TYPE.spend,
        params: { senderId: keyPair.publicKey, recipientId: keyPair.publicKey, amount: 100, ttl: 0, nonce: 1, fee: 100 }
      })
      signedTx = await MemoryAccount({ keypair: keyPair, networkId: 'ae_mainnet' }).signTransaction(txObject.encodedTx)
      txObject.encodedTx.should.be.a('string')
      Buffer.isBuffer(txObject.rlpEncoded).should.be.equal(true)
      txObject.binary.should.be.a('Array')
      txObject.params.should.be.a('object')
    })

    it('Unpack transaction from string/rlp', () => {
      const txFromString = TxObject.fromString(txObject.encodedTx)
      txFromString.rlpEncoded.equals(txObject.rlpEncoded).should.be.equal(true)
      Buffer.from(txFromString.binary).equals(Buffer.from(txObject.binary)).should.be.equal(true)
      txFromString.encodedTx.should.be.equal(txObject.encodedTx)
      txFromString.params.should.be.deep.include(txObject.params)
      const rtxFromRlpBinary = TxObject.fromRlp(txObject.rlpEncoded)
      rtxFromRlpBinary.rlpEncoded.equals(txObject.rlpEncoded).should.be.equal(true)
      Buffer.from(rtxFromRlpBinary.binary).equals(Buffer.from(txObject.binary)).should.be.equal(true)
      rtxFromRlpBinary.encodedTx.should.be.equal(txObject.encodedTx)
      rtxFromRlpBinary.params.should.be.deep.include(txObject.params)
    })

    it('Unpack signed transaction', () => {
      const tx = TxObject.fromString(signedTx)
      tx.getSignatures().length.should.not.be.equal(0)
      tx.isSigned.should.be.equal(true)
    })

    it('Get signature on unsigned tx', () => {
      expect(() => txObject.getSignatures())
        .to.throw('Signature not found, transaction is not signed')
    })

    it('Invalid props', () => {
      expect(() => txObject.setProp(true)).to.throw('Props should be an object')
    })

    it('Change props of signed transaction', () => {
      const signedTxObject = TxObject.fromString(signedTx)
      const fee = signedTxObject.params.fee
      signedTxObject.setProp({ amount: 10000 })
      signedTxObject.params.fee.should.not.be.equal(fee)
      signedTxObject.params.amount.should.be.equal('10000')
    })

    it('Add signatures', async () => {
      const oldTx = txObject.encodedTx
      const txWithNetworkId = Buffer.concat([Buffer.from('ae_mainnet'), txObject.rlpEncoded])
      const sig = await MemoryAccount({ keypair: keyPair }).sign(txWithNetworkId)
      txObject.addSignature(sig)
      txObject.getSignatures().length.should.be.equal(1)
      txObject.isSigned.should.be.equal(true)
      oldTx.should.not.be.equal(txObject.encodedTx)
    })

    it('Invalid signature', async () => {
      expect(() => txObject.addSignature({}))
        .to.throw('Invalid signature, signature must be of type Buffer or Uint8Array')
    })
  })
})

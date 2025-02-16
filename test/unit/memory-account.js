/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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

import '../'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import MemoryAccount from '../../src/account/memory'
import { generateKeyPair } from '../../src/utils/crypto'

const testAcc = generateKeyPair()

describe('MemoryAccount', function () {
  describe('Fail on invalid params', () => {
    it('Fail on empty keypair', async () => {
      expect(() => MemoryAccount({})).to.throw('KeyPair must be an object')
    })

    it('Fail on empty keypair object', async () => {
      expect(() => MemoryAccount({ keypair: {} }))
        .to.throw('KeyPair must must have "secretKey", "publicKey" properties')
    })

    it('Fail on invalid secret key', async () => {
      expect(() => MemoryAccount({ keypair: { publicKey: testAcc.publicKey, secretKey: ' ' } }))
        .to.throw('Secret key must be hex string or Buffer')
    })

    it('Fail on invalid publicKey', async () => {
      expect(() => MemoryAccount({ keypair: { publicKey: ' ', secretKey: testAcc.secretKey } }))
        .to.throw('Public Key must be a base58c string with "ak_" prefix')
    })

    it('Fail on invalid publicKey', async () => {
      const keypair = { publicKey: generateKeyPair().publicKey, secretKey: testAcc.secretKey }
      expect(() => MemoryAccount({ keypair })).to.throw('Invalid Key Pair')
    })
  })

  it('Init with secretKey as hex string', async () => {
    const acc = MemoryAccount({ keypair: testAcc })
    return acc.address().should.eventually.be.equal(testAcc.publicKey)
  })

  it('Init with secretKey as hex Buffer', async () => {
    const acc = MemoryAccount({
      keypair: {
        publicKey: testAcc.publicKey,
        secretKey: Buffer.from(testAcc.secretKey, 'hex')
      }
    })
    return acc.address().should.eventually.be.equal(testAcc.publicKey)
  })

  it('Sign message', async () => {
    const message = 'test'
    const acc = MemoryAccount({ keypair: testAcc })
    const sig = await acc.signMessage(message)
    const sigHex = await acc.signMessage(message, { returnHex: true })
    const isValid = await acc.verifyMessage(message, sig)
    const isValidHex = await acc.verifyMessage(message, sigHex)
    isValid.should.be.equal(true)
    isValidHex.should.be.equal(true)
  })
})

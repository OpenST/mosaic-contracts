// Copyright 2017 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Test: Owned.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('../lib/utils.js')
const OwnedUtils = require('./Owned_utils.js')

const BigNumber = require('bignumber.js')

const Owned = artifacts.require("./Owned.sol")


//
// Basic properties
//    owner
//
// initiateOwnershipTransfer
//    to 0
//    to this
//    to current owner
//    to accounts[1] as non-owner
//    to accounts[1]
//
// completeOwnershipTransfer
//    from accounts[2]
//    from current owner
//    from accounts[1]
//

contract('OpsManaged', (accounts) => {


   async function createOwned() {
      return await Owned.new()
   }


   describe('Basic properties', async () => {

      var instance = null

      before(async () => {
         instance = await createOwned()
      })


      it("owner", async () => {
         assert.equal(await instance.owner.call(), accounts[0])
      })

      it("proposedOwner", async () => {
         assert.equal(await instance.proposedOwner.call(), 0)
      })
   })


   describe('initiateOwnershipTransfer', async () => {

      var instance = null

      before(async () => {
         instance = await createOwned()
      })

      it("to 0", async () => {
         assert.equal(await instance.initiateOwnershipTransfer.call(0), true)
         OwnedUtils.checkOwnershipTransferInitiatedEventGroup(await instance.initiateOwnershipTransfer(0), 0)
      })

      it("to this", async () => {
         assert.equal(await instance.initiateOwnershipTransfer.call(instance.address), true)
         OwnedUtils.checkOwnershipTransferInitiatedEventGroup(await instance.initiateOwnershipTransfer(instance.address), instance.address)
      })

      it("to current owner", async () => {
         const owner = await instance.owner.call()
         assert.equal(await instance.initiateOwnershipTransfer.call(owner), true)
         OwnedUtils.checkOwnershipTransferInitiatedEventGroup(await instance.initiateOwnershipTransfer(owner), owner)
      })

      it("to accounts[1] as non-owner", async () => {
         await Utils.expectThrow(instance.initiateOwnershipTransfer.call(accounts[1], { from: accounts[2] }))
      })

      it("to accounts[1]", async () => {
         assert.equal(await instance.initiateOwnershipTransfer.call(accounts[1]), true)
         OwnedUtils.checkOwnershipTransferInitiatedEventGroup(await instance.initiateOwnershipTransfer(accounts[1]), accounts[1])
      })
   })


   describe('completeOwnershipTransfer', async () => {

      var instance = null

      before(async () => {
         instance = await createOwned()
      })


      it("from accounts[2]", async () => {
         await Utils.expectThrow(instance.completeOwnershipTransfer.call({ from: accounts[2] }))
      })

      it("from current owner", async () => {
         const owner = await instance.owner.call()
         await Utils.expectThrow(instance.completeOwnershipTransfer.call({ from: owner }))
      })

      it("from account[1]", async () => {
         assert.equal(await instance.owner.call(), accounts[0])
         assert.equal(await instance.proposedOwner.call(), 0)
         await instance.initiateOwnershipTransfer(accounts[1])
         assert.equal(await instance.proposedOwner.call(), accounts[1])

         assert.equal(await instance.completeOwnershipTransfer.call({ from: accounts[1] }), true)
         OwnedUtils.checkOwnershipTransferCompletedEventGroup(await instance.completeOwnershipTransfer({ from: accounts[1] }), accounts[1])

         assert.equal(await instance.owner.call(), accounts[1])
         assert.equal(await instance.proposedOwner.call(), 0)
      })
   })
})

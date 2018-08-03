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
// Test: OpsManaged.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js')

const Utils = require('../lib/utils.js')
const OpsManagedUtils = require('./OpsManaged_utils.js');

const OpsManaged = artifacts.require("./OpsManaged.sol")


//
// Basic properties
//    owner
//    adminAddress
//    opsAddress
//
// setAdminAddress
//    setAdminAddress to owner
//    setAdminAddress to this
//    setAdminAddress to ops address
//    setAdminAddress to account[1]
//    setAdminAddress to 0
//
// setOpsAddress
//    setOpsAddress to owner
//    setOpsAddress to this
//    setOpsAddress to ops address
//    setOpsAddress to account[1]
//    setOpsAddress to 0
//

contract('OpsManaged', (accounts) => {


   async function createOpsManaged() {
      return await OpsManaged.new()
   }


   describe('Basic properties', async () => {

      var instance = null

      before(async () => {
         instance = await createOpsManaged()
      })


      it("owner", async () => {
         assert.equal(await instance.owner.call(), accounts[0])
      })

      it("adminAddress", async () => {
         assert.equal(await instance.adminAddress.call(), 0)
      })

      it("opsAddress", async () => {
         assert.equal(await instance.opsAddress.call(), 0)
      })
   })


   describe('setAdminAddress', async () => {

      var instance = null

      before(async () => {
         instance = await createOpsManaged()
      })


      it("to the owner", async () => {
          const owner = await instance.owner.call()
          await Utils.expectThrow(instance.setAdminAddress.call(owner))
      })

      it("to 'this'", async () => {
          await Utils.expectThrow(instance.setAdminAddress.call(instance.address))
      })

      it("to ops address", async () => {
          assert.equal(await instance.setOpsAddress.call(accounts[2]), true)
          await instance.setOpsAddress(accounts[2])

          await Utils.expectThrow(instance.setAdminAddress.call(accounts[2]))
      })

      it("to accounts[1]", async () => {
          assert.equal(await instance.adminAddress.call(), 0)
          assert.equal(await instance.setAdminAddress.call(accounts[1]), true)
          OpsManagedUtils.checkAdminAddressChangedEventGroup(await instance.setAdminAddress(accounts[1]), accounts[1])
          assert.equal(await instance.adminAddress.call(), accounts[1])
      })

      it("to 0", async () => {
          assert.equal(await instance.adminAddress.call(), accounts[1])
          assert.equal(await instance.setAdminAddress.call(0), true)
          OpsManagedUtils.checkAdminAddressChangedEventGroup(await instance.setAdminAddress(0), 0)
          assert.equal(await instance.adminAddress.call(), 0)
      })
   })


   describe('setOpsAddress', async () => {

      var instance = null

      before(async () => {
         instance = await createOpsManaged()
      })


      it("to the owner", async () => {
          const owner = await instance.owner.call()
          await Utils.expectThrow(instance.setOpsAddress.call(owner))
      })

      it("to 'this'", async () => {
          await Utils.expectThrow(instance.setOpsAddress.call(instance.address))
      })

      it("to ops address", async () => {
          assert.equal(await instance.setAdminAddress.call(accounts[3]), true)
          await instance.setAdminAddress(accounts[3])

          await Utils.expectThrow(instance.setOpsAddress.call(accounts[3]))
      })

      it("to accounts[1]", async () => {
          assert.equal(await instance.opsAddress.call(), 0)
          assert.equal(await instance.setOpsAddress.call(accounts[1]), true)
          OpsManagedUtils.checkOpsAddressChangedEventGroup(await instance.setOpsAddress(accounts[1]), accounts[1])
          assert.equal(await instance.opsAddress.call(), accounts[1])
      })

      it("to 0", async () => {
          assert.equal(await instance.opsAddress.call(), accounts[1])
          assert.equal(await instance.setAdminAddress.call(0), true)
          OpsManagedUtils.checkOpsAddressChangedEventGroup(await instance.setOpsAddress(0), 0)
          assert.equal(await instance.opsAddress.call(), 0)
      })
   })
})

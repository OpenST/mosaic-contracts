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
// Test: SimpleToken.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
// const Web3 = require('web3');
const Moment = require('moment');
const BigNumber = require('bignumber.js');

const Utils = require('./lib/utils.js');
const SimpleTokenUtils = require('./SimpleToken_utils.js')
const EIP20Token_utils = require('./EIP20Token_utils.js')


const SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol")


//
// Basic properties
//    name
//    symbol
//    decimals
//    totalSupply
//    balances is private
//    Constructor raised transfer event
//
// transfer before finalize
//    transfer from owner to other
//    transfer 0 tokens
//    transfer > balance
//    transfer = balance
//    transfer 1 token
//    transfer 10000 tokens
//
// transfer after finalize
//    transfer 0 tokens
//    transfer > balance
//    transfer = balance
//    transfer 1 token
//    transfer 10000 tokens
//
// transferFrom
//    transfer    0  from account 0 -> 1 with 0 allowance
//    transfer 1000  from account 0 -> 1 without allowance
//    transfer 1000  from account 0 -> 1 with 10 allowance
//    transfer 1000  from account 0 -> 1 with 1000 allowance
//    transfer 50+50 from account 0 -> 1 with 100 allowance
//    transfer 1000  from account 0 -> 1 with 999 allowance
//    transfer    1  from account 0 -> 1 with 0 allowance
//
// transferFrom after finalize
//    transfer    0  from account 0 -> 1 with 0 allowance
//    transfer 1000  from account 0 -> 1 without allowance
//    transfer 1000  from account 0 -> 1 with 10 allowance
//    transfer 1000  from account 0 -> 1 with 1000 allowance
//    transfer 50+50 from account 0 -> 1 with 100 allowance
//    transfer 1000  from account 0 -> 1 with 999 allowance
//    transfer    1  from account 0 -> 1 with 0 allowance
//
// approve
// balanceOf
// allowance
//    * covered indirectly by testing the other functions
//
// burn
//    burn greater than balance
//    burn less than or equal to balance
//
// balances
//    check if balances is exposed publicly
//
// owner and operations
//    - owner is set
//    - admin is 0
//    - operations is 0
//    - set operations key
//    - set operations key
//    - finalize (owner + ops)
//
// finalize
//    - check properties before and after finalize
//    - try to finalize a 2nd time
//    * other cases covered indirectly by testing other functions
//

contract('SimpleToken', (accounts) => {
   
   const SYMBOL         = "ST"
   const NAME           = "Simple Token"
   const DECIMALS       = 18
   const TOTAL_SUPPLY   = new BigNumber(web3.toWei(800000000, "ether"));
      
   const ST10000 = new BigNumber(web3.toWei(10000, "ether"));
   const ST9000 = new BigNumber(web3.toWei(9000, "ether"));
   const ST1000 = new BigNumber(web3.toWei(1000, "ether"));
   const ST10 = new BigNumber(web3.toWei(10, "ether"));
   const ST1 = new BigNumber(web3.toWei(1, "ether"));

   const owner  = accounts[0]
   const admin  = accounts[1]
   const ops    = accounts[2]

   async function createToken() {
      return await SimpleToken.new()
   }


   describe('Basic properties', async () => {

      var token = null

      before(async () => {
         token = await createToken()
      })


      it("name", async () => {
         assert.equal(await token.name.call(), NAME)
      })

      it("symbol", async () => {
         assert.equal(await token.symbol.call(), SYMBOL)
      })

      it("decimals", async () => {
         assert.equal(await token.decimals.call(), DECIMALS)
      })

      it("totalSupply", async () => {
         assert.equal((await token.totalSupply.call()).toNumber(), TOTAL_SUPPLY.toNumber())
      })

      it("balances is private", async () => {
         assert.isTrue(typeof(token.balances) == 'undefined')
      })

      it('Constructor raised transfer event', async () => {
          const receipt = await web3.eth.getTransactionReceipt(token.transactionHash)
          assert.equal(receipt.logs.length, 1)
          const logs = Utils.decodeLogs(token.abi, [ receipt.logs[0] ])
          EIP20Token_utils.checkTransferEvent(logs[0], 0, accounts[0], TOTAL_SUPPLY)
      })
      // it('Constructor raised transfer event', async () => {
      //     const receipt = await web3.eth.getTransactionReceipt(token.transactionHash)
      //     assert.equal(receipt.logs.length, 1)
      //     console.log("Simple Token -------- token.abi");
      //     console.log(token.abi.length)
      //     console.log(JSON.stringify(token.abi[32], null, 4));
      //     console.log("Simple Token -------- receipt.logs[0]");
      //     console.log(receipt.logs[0])
      //     console.log("Simple Token -------- receipt.logs[0].topics");
      //     console.log(receipt.logs[0].topics)
      //     // @dev SimpleToken abi[32] is 'Transfer' event;
      //     // solve this better for moving to web3 v1.0.0
      //     // var inputs = token.abi[32].inputs;
      //     // var data = receipt.logs[0].data;
      //     // var topics = receipt.logs[0].topics;
      //     // const logs = Web3.eth.abi.decodeLog(inputs, data, topics)
      //     // console.log(JSON.stringify(logs, null, 4));
      //     // Utils.checkTransferEvent(logs, 0, accounts[0], TOTAL_SUPPLY)
      // })
   })


   describe('transfer function after finalize', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)

         await token.finalize({ from: admin })
      })

      it("transfer tokens from owner to other", async () => {         
         var res = await token.transfer(accounts[1], ST1000);
         EIP20Token_utils.checkTransferEventGroup(await token.transfer(accounts[1], ST1000), accounts[0], accounts[1], ST1000)
      })

      it("transfer 0 tokens", async () => {
         assert.equal(await token.transfer.call(accounts[2], 0, { from: accounts[1] }), true)
         EIP20Token_utils.checkTransferEventGroup(await token.transfer(accounts[2], 0, { from: accounts[1] }), accounts[1], accounts[2], 0)
      })

      it("transfer > balance", async () => {
         const balance = await token.balanceOf.call(accounts[1])
         await Utils.expectThrow(token.transfer.call(accounts[2], balance.add(ST1), { from: accounts[1] }))
      })

      it("transfer = balance", async () => {
         const balance1Before = await token.balanceOf.call(accounts[1])
         const balance2Before = await token.balanceOf.call(accounts[2])

         assert.equal(await token.transfer.call(accounts[2], balance1Before, { from: accounts[1] }), true)
         await token.transfer(accounts[2], balance1Before, { from: accounts[1] })

         const balance1After = await token.balanceOf.call(accounts[1])
         const balance2After = await token.balanceOf.call(accounts[2])

         assert.equal(balance1After.toNumber(), 0)
         assert.equal(balance2After.sub(balance2Before).toNumber(), balance1Before.sub(balance1After).toNumber(), balance1Before.toNumber())
      })

      it("transfer 1 token", async () => {
         const balance1Before = await token.balanceOf.call(accounts[1])
         const balance2Before = await token.balanceOf.call(accounts[2])

         assert.equal(await token.transfer.call(accounts[1], ST1, { from: accounts[2] }), true)
         await token.transfer(accounts[1], ST1, { from: accounts[2] })

         const balance1After = await token.balanceOf.call(accounts[1])
         const balance2After = await token.balanceOf.call(accounts[2])

         assert.equal(balance1After.toNumber(), ST1.toNumber())
         assert.equal(balance2After.toNumber(), balance2Before.sub(ST1).toNumber())
      })
   })


   describe('transferFrom function before finalize', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)

         await token.transfer(accounts[4], ST10000)
      })


      it("transfer 0 from account 1 -> 2 with 0 allowance", async () => {
         assert.equal(await token.approve.call(accounts[2], 0, { from: accounts[4] }), true)
         assert.equal(await token.allowance.call(accounts[4], accounts[2]), 0)
         await Utils.expectThrow(token.transferFrom.call(accounts[4], accounts[2], ST10, { from: accounts[2] }))
      })

      it("transfer 1000 from account 1 -> 2 without allowance", async () => {
         await Utils.expectThrow(token.transferFrom.call(accounts[4], accounts[2], ST1000, { from: accounts[4] }))
         await Utils.expectThrow(token.transferFrom.call(accounts[4], accounts[2], ST1000, { from: accounts[2] }))
      })

      it("transfer 1000 from account 1 -> 2 with 10 allowance", async () => {
         assert.equal(await token.approve.call(accounts[2], ST10, { from: accounts[4] }), true)
         EIP20Token_utils.checkApprovalEventGroup(await token.approve(accounts[2], ST10, { from: accounts[4] }), accounts[4], accounts[2], ST10)

         assert.equal((await token.allowance.call(accounts[4], accounts[2], { from: accounts[4] })).toNumber(), ST10.toNumber())

         await Utils.expectThrow(token.transferFrom.call(accounts[4], accounts[2], ST1000, { from: accounts[4] }))
         await Utils.expectThrow(token.transferFrom.call(accounts[4], accounts[2], ST1000, { from: accounts[2] }))
      })

      it("transfer 1000 from account 1 -> 2 with 1000 allowance (as ops)", async () => {
         // We first need to bring approval to 0
         assert.equal(await token.approve.call(ops, 0, { from: accounts[4] }), true)
         EIP20Token_utils.checkApprovalEventGroup(await token.approve(ops, 0, { from: accounts[4] }), accounts[4], ops, 0)

         assert.equal(await token.allowance.call(accounts[4], ops, { from: accounts[4] }), 0)

         assert.equal(await token.approve.call(ops, ST1000, { from: accounts[4] }), true)
         EIP20Token_utils.checkApprovalEventGroup(await token.approve(ops, ST1000, { from: accounts[4] }), accounts[4], ops, ST1000)

         assert.equal(await token.allowance.call(accounts[4], ops), ST1000.toNumber(), { from: accounts[4] })

         await Utils.expectThrow(token.transferFrom.call(accounts[4], ops, ST1000, { from: accounts[4] }))
         assert.equal(await token.transferFrom.call(accounts[4], ops, ST1000, { from: ops }), true)
         await token.transferFrom(accounts[4], ops, ST1000, { from: ops })
         
         assert.equal((await token.balanceOf.call(accounts[4])).toNumber(), ST9000.toNumber())
         assert.equal((await token.balanceOf.call(ops)).toNumber(), ST1000.toNumber())
      })

      it("transfer 1000 from account 1 -> 2 with 1000 allowance (as admin)", async () => {
         // We first need to bring approval to 0
         assert.equal(await token.approve.call(admin, 0, { from: accounts[4] }), true)
         EIP20Token_utils.checkApprovalEventGroup(await token.approve(admin, 0, { from: accounts[4] }), accounts[4], admin, 0)

         assert.equal(await token.allowance.call(accounts[4], admin, { from: accounts[4] }), 0)

         assert.equal(await token.approve.call(admin, ST1000, { from: accounts[4] }), true)
         EIP20Token_utils.checkApprovalEventGroup(await token.approve(admin, ST1000, { from: accounts[4] }), accounts[4], admin, ST1000)

         assert.equal(await token.allowance.call(accounts[4], admin), ST1000.toNumber(), { from: accounts[4] })

         await Utils.expectThrow(token.transferFrom.call(accounts[4], admin, ST1000, { from: accounts[4] }))
         await Utils.expectThrow(token.transferFrom.call(accounts[4], admin, ST1000, { from: admin }))
      })
   })


   describe('transferFrom function after finalize', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)

         await token.transfer(accounts[1], ST10000)

         token.finalize({ from: admin })
      })


      it("transfer 0 from account 1 -> 2 with 0 allowance", async () => {
         assert.equal(await token.approve.call(accounts[2], 0, { from: accounts[1] }), true)
         assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0)
         assert.equal(await token.transferFrom.call(accounts[1], accounts[2], 0, { from: accounts[1] }), true)
         assert.equal(await token.transferFrom.call(accounts[1], accounts[2], 0, { from: accounts[2] }), true)
      })

      it("transfer 1000 from account 1 -> 2 without allowance", async () => {
         await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[1] }))
         await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[2] }))
      })

      it("transfer 1000 from account 1 -> 2 with 10 allowance", async () => {
         assert.equal(await token.approve.call(accounts[2], ST10, { from: accounts[1] }), true)
         await token.approve(accounts[2], ST10, { from: accounts[1] })
         assert.equal(await token.allowance.call(accounts[1], accounts[2]), ST10.toNumber())
         await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[1] }))
         await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[2] }))
      })

      it("transfer 1000 from account 1 -> 2 with 1000 allowance", async () => {
         // We first need to bring approval to 0
         assert.equal(await token.approve.call(accounts[2], 0, { from: accounts[1] }), true)
         await token.approve(accounts[2], 0, { from: accounts[1] })
         assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0)

         assert.equal(await token.approve.call(accounts[2], ST1000, { from: accounts[1] }), true)
         await token.approve(accounts[2], ST1000, { from: accounts[1] })
         assert.equal(await token.allowance.call(accounts[1], accounts[2]), ST1000.toNumber())

         await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[1] }))
         assert.equal(await token.transferFrom.call(accounts[1], accounts[2], ST1000, { from: accounts[2] }), true)
         await token.transferFrom(accounts[1], accounts[2], ST1000, { from: accounts[2] })

         assert.equal((await token.balanceOf.call(accounts[1])).toNumber(), ST9000.toNumber())
         assert.equal((await token.balanceOf.call(accounts[2])).toNumber(), ST1000.toNumber())
      })
   })


   describe('owner and operations', async () => {

      var token = null


      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)

         await token.transfer(accounts[1], ST10000)
         await token.transfer(accounts[2], ST1000)
      })


      it("check initial owner", async () => {
         assert.equal(await token.owner.call(), accounts[0])
      })

      it("check initial admin", async () => {
         assert.equal(await token.adminAddress.call(), accounts[1])
      })

      it("check initial ops", async () => {
         assert.equal(await token.opsAddress.call(), accounts[2])
      })

      it("change ops address to some account", async () => {
         assert.equal(await token.setOpsAddress.call(accounts[5]), true)
         await token.setOpsAddress(accounts[5])
      })

      it("change ops address to 0", async () => {
         assert.equal(await token.setOpsAddress.call(0), true)
         await token.setOpsAddress(0)
      })

      it("change ops address to account 3", async () => {
         assert.equal(await token.setOpsAddress.call(accounts[3]), true)
         await token.setOpsAddress(accounts[3])
      })

      it("finalize as normal", async () => {
         await Utils.expectThrow(token.finalize.call({ from: accounts[4] }))
      })

      it("finalize as ops", async () => {
         await Utils.expectThrow(token.finalize.call({ from: ops }))
      })

      it("finalize as admin", async () => {
         assert.equal(await token.finalize.call({ from: admin }), true)
      })
   })


   describe('finalize function', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)
      })


      it("check properties before and after finalize", async () => {
         assert.equal(await token.finalized.call(), false)
         SimpleTokenUtils.checkFinalizedEventGroup(await token.finalize({ from: admin }))
         assert.equal(await token.finalized.call(), true)
      })

      it("try to finalize a 2nd time", async () => {
         await Utils.expectThrow(token.finalize.call({ from: admin }))
      })
   })


   describe('burn function', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setOpsAddress(ops)
         await token.setAdminAddress(admin)
      })

      it("burn greater than balance", async () => {
         await Utils.expectThrow(token.burn.call((TOTAL_SUPPLY.plus(ST1)), { from: accounts[0] }))
      })

      it("burn less than or equal to balance", async () => {
         const balanceBefore = await token.balanceOf(accounts[0])

         SimpleTokenUtils.checkBurntEventGroup(await token.burn(ST1000, { from: accounts[0] }))

         const currentBalance = await token.balanceOf(accounts[0])
         const currentSupply = await token.totalSupply.call()

         assert.equal(balanceBefore.minus(currentBalance).toNumber(), ST1000.toNumber())
         assert.equal(TOTAL_SUPPLY.minus(currentSupply).toNumber(), ST1000.toNumber())
      })
   })
})

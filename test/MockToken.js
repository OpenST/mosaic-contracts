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
const BigNumber = require('bignumber.js');

const Utils = require('./lib/utils.js');
const MockTokenUtils = require('./MockToken_utils.js')
const EIP20Token_utils = require('./EIP20Token_utils.js')
const web3EventsDecoder = require('./lib/event_decoder.js');

const MockToken = artifacts.require("./MockToken.sol")


//
// Basic properties
//    name
//    symbol
//    decimals
//    totalSupply
//    balances is private
//    Constructor raised transfer event
//
// transfer function
//    transfer from owner to other
//    transfer 0 tokens
//    transfer > balance
//    transfer = balance
//    transfer 1 token
//
//
// transferFrom after finalize
//    transfer    0  from account 0 -> 1 with 0 allowance
//    transfer 1000  from account 0 -> 1 without allowance
//    transfer 1000  from account 0 -> 1 with 10 allowance
//    transfer 1000  from account 0 -> 1 with 1000 allowance
//
// approve
// balanceOf
// allowance
//    * covered indirectly by testing the other functions
//
// owner and operations
//    check initial owner
//    check initial admin
//    check initial ops
//    change ops address to some account
//    change ops address to 0
//    change ops address to account 3
//
// burn
//    burn greater than balance
//    burn less than or equal to balance

contract('MockToken', (accounts) => {

  const SYMBOL = "MOCK"
  const NAME = "Mock Token"
  const DECIMALS = 18
  const TOTAL_SUPPLY = new BigNumber(web3.toWei(800000000, "ether"));

  const ST10000 = new BigNumber(web3.toWei(10000, "ether"));
  const ST9000 = new BigNumber(web3.toWei(9000, "ether"));
  const ST1000 = new BigNumber(web3.toWei(1000, "ether"));
  const ST10 = new BigNumber(web3.toWei(10, "ether"));
  const ST1 = new BigNumber(web3.toWei(1, "ether"));

  const owner = accounts[0]
  const admin = accounts[1]
  const ops = accounts[2]

  async function createToken() {
    return await MockToken.new()
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
      const logs = web3EventsDecoder.perform(receipt, token.address, token.abi);
      EIP20Token_utils.checkTransferEventAbiDecoder(logs, 0, accounts[0], TOTAL_SUPPLY)
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


  describe('transfer function', async () => {

    var token = null

    before(async () => {
      token = await createToken()

    })

    it("transfer tokens from owner to other", async () => {
      var res = await token.transfer(accounts[1], ST1000);
      EIP20Token_utils.checkTransferEventGroup(await token.transfer(accounts[1], ST1000), accounts[0], accounts[1], ST1000)
    })

    it("transfer 0 tokens", async () => {
      assert.equal(await token.transfer.call(accounts[2], 0, {from: accounts[1]}), true)
      EIP20Token_utils.checkTransferEventGroup(await token.transfer(accounts[2], 0, {from: accounts[1]}), accounts[1], accounts[2], 0)
    })

    it("transfer > balance", async () => {
      const balance = await token.balanceOf.call(accounts[1])
      await Utils.expectThrow(token.transfer.call(accounts[2], balance.add(ST1), {from: accounts[1]}))
    })

    it("transfer = balance", async () => {
      const balance1Before = await token.balanceOf.call(accounts[1])
      const balance2Before = await token.balanceOf.call(accounts[2])

      assert.equal(await token.transfer.call(accounts[2], balance1Before, {from: accounts[1]}), true)
      await token.transfer(accounts[2], balance1Before, {from: accounts[1]})

      const balance1After = await token.balanceOf.call(accounts[1])
      const balance2After = await token.balanceOf.call(accounts[2])

      assert.equal(balance1After.toNumber(), 0)
      assert.equal(balance2After.sub(balance2Before).toNumber(), balance1Before.sub(balance1After).toNumber(), balance1Before.toNumber())
    })

    it("transfer 1 token", async () => {
      const balance1Before = await token.balanceOf.call(accounts[1])
      const balance2Before = await token.balanceOf.call(accounts[2])

      assert.equal(await token.transfer.call(accounts[1], ST1, {from: accounts[2]}), true)
      await token.transfer(accounts[1], ST1, {from: accounts[2]})

      const balance1After = await token.balanceOf.call(accounts[1])
      const balance2After = await token.balanceOf.call(accounts[2])

      assert.equal(balance1After.toNumber(), ST1.toNumber())
      assert.equal(balance2After.toNumber(), balance2Before.sub(ST1).toNumber())
    })
  })


  describe('transferFrom function', async () => {

    var token = null

    before(async () => {
      token = await createToken()

      await token.transfer(accounts[1], ST10000)
    })

    it("transfer 0 from account 1 -> 2 with 0 allowance", async () => {
      assert.equal(await token.approve.call(accounts[2], 0, {from: accounts[1]}), true)
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0)
      assert.equal(await token.transferFrom.call(accounts[1], accounts[2], 0, {from: accounts[1]}), true)
      assert.equal(await token.transferFrom.call(accounts[1], accounts[2], 0, {from: accounts[2]}), true)
    })

    it("transfer 1000 from account 1 -> 2 without allowance", async () => {
      await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[1]}))
      await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[2]}))
    })

    it("transfer 1000 from account 1 -> 2 with 10 allowance", async () => {
      assert.equal(await token.approve.call(accounts[2], ST10, {from: accounts[1]}), true)
      await token.approve(accounts[2], ST10, {from: accounts[1]})
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), ST10.toNumber())
      await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[1]}))
      await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[2]}))
    })

    it("transfer 1000 from account 1 -> 2 with 1000 allowance", async () => {
      // We first need to bring approval to 0
      assert.equal(await token.approve.call(accounts[2], 0, {from: accounts[1]}), true)
      await token.approve(accounts[2], 0, {from: accounts[1]})
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0)

      assert.equal(await token.approve.call(accounts[2], ST1000, {from: accounts[1]}), true)
      await token.approve(accounts[2], ST1000, {from: accounts[1]})
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), ST1000.toNumber())

      await Utils.expectThrow(token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[1]}))
      assert.equal(await token.transferFrom.call(accounts[1], accounts[2], ST1000, {from: accounts[2]}), true)
      await token.transferFrom(accounts[1], accounts[2], ST1000, {from: accounts[2]})

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
  })

  describe('burn function', async () => {

    var token = null

    before(async () => {
      token = await createToken()
    })

    it("burn greater than balance", async () => {
      await Utils.expectThrow(token.burn.call((TOTAL_SUPPLY.plus(ST1)), {from: accounts[0]}))
    })

    it("burn less than or equal to balance", async () => {
      const balanceBefore = await token.balanceOf(accounts[0])

      MockTokenUtils.checkBurntEventGroup(await token.burn(ST1000, {from: accounts[0]}))

      const currentBalance = await token.balanceOf(accounts[0])
      const currentSupply = await token.totalSupply.call()

      assert.equal(balanceBefore.minus(currentBalance).toNumber(), ST1000.toNumber())
      assert.equal(TOTAL_SUPPLY.minus(currentSupply).toNumber(), ST1000.toNumber())
    })
  })
})

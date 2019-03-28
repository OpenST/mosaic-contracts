// Copyright 2019 OpenST Ltd.
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
// Test: mock_token.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const web3 = require('../test_lib/web3.js');

const Utils = require('../test_lib/utils.js');
const EIP20TokenUtils = require('./EIP20_token_utils.js');
const EventsDecoder = require('../test_lib/event_decoder.js');

const MockToken = artifacts.require('./MockToken.sol');

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
//    initiate ownership transfer to some account
//    complete ownership transfer to some account
//    check new owner post transfer
//    revert to initial owner

contract('MockToken', (accounts) => {
  const SYMBOL = 'MOCK';
  const NAME = 'Mock Token';
  const DECIMALS = 18;
  const TOTAL_SUPPLY = web3.utils.toWei(new BN('800000000'), 'ether');

  const ST10000 = web3.utils.toWei(new BN('10000'), 'ether');
  const ST9000 = web3.utils.toWei(new BN('9000'), 'ether');
  const ST1000 = web3.utils.toWei(new BN('1000'), 'ether');
  const ST10 = web3.utils.toWei(new BN('10'), 'ether');
  const ST1 = web3.utils.toWei(new BN('1'), 'ether');

  async function createToken() {
    return MockToken.new();
  }

  describe('Basic properties', async () => {
    let token = null;

    before(async () => {
      token = await createToken();
    });

    it('name', async () => {
      assert.equal(await token.name.call(), NAME);
    });

    it('symbol', async () => {
      assert.equal(await token.symbol.call(), SYMBOL);
    });

    it('decimals', async () => {
      assert.equal(await token.decimals.call(), DECIMALS);
    });

    it('totalSupply', async () => {
      assert((await token.totalSupply.call()).eq(TOTAL_SUPPLY));
    });

    it('balances is private', async () => {
      assert.isTrue(typeof token.balances === 'undefined');
    });

    it('Constructor raised transfer event', async () => {
      const receipt = await web3.eth.getTransactionReceipt(
        token.transactionHash,
      );
      assert.equal(receipt.logs.length, 1);
      const logs = EventsDecoder.perform(
        receipt,
        token.address,
        token.abi,
      );
      EIP20TokenUtils.checkTransferEventAbiDecoder(
        logs,
        0,
        accounts[0],
        TOTAL_SUPPLY,
      );
    });
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
  });

  describe('transfer function', async () => {
    let token = null;

    before(async () => {
      token = await createToken();
    });

    it('transfer tokens from owner to other', async () => {
      await token.transfer(accounts[1], ST1000);
      EIP20TokenUtils.checkTransferEventGroup(
        await token.transfer(accounts[1], ST1000),
        accounts[0],
        accounts[1],
        ST1000,
      );
    });

    it('transfer 0 tokens', async () => {
      assert.equal(
        await token.transfer.call(accounts[2], 0, { from: accounts[1] }),
        true,
      );
      EIP20TokenUtils.checkTransferEventGroup(
        await token.transfer(accounts[2], 0, { from: accounts[1] }),
        accounts[1],
        accounts[2],
        0,
      );
    });

    it('transfer > balance', async () => {
      const balance = await token.balanceOf.call(accounts[1]);
      await Utils.expectThrow(
        token.transfer.call(accounts[2], balance.add(ST1), {
          from: accounts[1],
        }),
      );
    });

    it('transfer = balance', async () => {
      const balance1Before = await token.balanceOf.call(accounts[1]);
      const balance2Before = await token.balanceOf.call(accounts[2]);

      assert.equal(
        await token.transfer.call(accounts[2], balance1Before, {
          from: accounts[1],
        }),
        true,
      );
      await token.transfer(accounts[2], balance1Before, {
        from: accounts[1],
      });

      const balance1After = await token.balanceOf.call(accounts[1]);
      const balance2After = await token.balanceOf.call(accounts[2]);

      assert(balance1After.eqn(0));
      assert(
        balance2After
          .sub(balance2Before)
          .eq(balance1Before.sub(balance1After)),
      );
    });

    it('transfer 1 token', async () => {
      const balance2Before = await token.balanceOf.call(accounts[2]);

      assert.equal(
        await token.transfer.call(accounts[1], ST1, { from: accounts[2] }),
        true,
      );
      await token.transfer(accounts[1], ST1, { from: accounts[2] });

      const balance1After = await token.balanceOf.call(accounts[1]);
      const balance2After = await token.balanceOf.call(accounts[2]);

      assert(balance1After.eq(ST1));
      assert(balance2After.eq(balance2Before.sub(ST1)));
    });
  });

  describe('transferFrom function', async () => {
    let token = null;

    before(async () => {
      token = await createToken();

      await token.transfer(accounts[1], ST10000);
    });

    it('transfer 0 from account 1 -> 2 with 0 allowance', async () => {
      assert.equal(
        await token.approve.call(accounts[2], 0, { from: accounts[1] }),
        true,
      );
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0);
      assert.equal(
        await token.transferFrom.call(accounts[1], accounts[2], 0, {
          from: accounts[1],
        }),
        true,
      );
      assert.equal(
        await token.transferFrom.call(accounts[1], accounts[2], 0, {
          from: accounts[2],
        }),
        true,
      );
    });

    it('transfer 1000 from account 1 -> 2 without allowance', async () => {
      await Utils.expectThrow(
        token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[1],
        }),
      );
      await Utils.expectThrow(
        token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[2],
        }),
      );
    });

    it('transfer 1000 from account 1 -> 2 with 10 allowance', async () => {
      assert.equal(
        await token.approve.call(accounts[2], ST10, { from: accounts[1] }),
        true,
      );
      await token.approve(accounts[2], ST10, { from: accounts[1] });
      assert(
        ST10.eq(new BN(await token.allowance.call(accounts[1], accounts[2]))),
      );
      await Utils.expectThrow(
        token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[1],
        }),
      );
      await Utils.expectThrow(
        token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[2],
        }),
      );
    });

    it('transfer 1000 from account 1 -> 2 with 1000 allowance', async () => {
      // We first need to bring approval to 0
      assert.equal(
        await token.approve.call(accounts[2], 0, { from: accounts[1] }),
        true,
      );
      await token.approve(accounts[2], 0, { from: accounts[1] });
      assert.equal(await token.allowance.call(accounts[1], accounts[2]), 0);

      assert.equal(
        await token.approve.call(accounts[2], ST1000, { from: accounts[1] }),
        true,
      );
      await token.approve(accounts[2], ST1000, { from: accounts[1] });
      assert(
        ST1000.eq(
          new BN(await token.allowance.call(accounts[1], accounts[2])),
        ),
      );

      await Utils.expectThrow(
        token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[1],
        }),
      );
      assert.equal(
        await token.transferFrom.call(accounts[1], accounts[2], ST1000, {
          from: accounts[2],
        }),
        true,
      );
      await token.transferFrom(accounts[1], accounts[2], ST1000, {
        from: accounts[2],
      });

      assert((await token.balanceOf.call(accounts[1])).eq(ST9000));
      assert((await token.balanceOf.call(accounts[2])).eq(ST1000));
    });
  });
});

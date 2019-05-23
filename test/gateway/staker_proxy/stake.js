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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const SpyGateway = artifacts.require('./SpyEIP20Gateway.sol');
const SpyToken = artifacts.require('./SpyToken.sol');
const StakerProxy = artifacts.require('./StakerProxy.sol');
const Utils = require('../../test_lib/utils');

contract('StakerProxy.stake()', (accounts) => {
  const [composer, owner, beneficiary, someoneElse] = accounts;

  const amount = '10001';
  const gasPrice = '400';
  const gasLimit = '10000000';
  const nonce = '42';
  const hashLock = '0x6666666666666666666666666666666666666666666666666666666666666666';

  let stakerProxy;
  let spyGateway;

  beforeEach(async () => {
    // Deploying from a simple account, as proxy won't call on it in this test.
    stakerProxy = await StakerProxy.new(
      owner,
      { from: composer },
    );

    spyGateway = await SpyGateway.new();
  });

  it('should approve and stake on the gateway', async () => {
    const spyValueToken = await SpyToken.at(await spyGateway.valueToken.call());
    const spyBaseToken = await SpyToken.at(await spyGateway.baseToken.call());

    await stakerProxy.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      spyGateway.address,
      { from: composer },
    );

    assert.strictEqual(
      (await spyGateway.amount.call()).toString(10),
      amount,
      'The spy did not record the correct amount staked.',
    );

    assert.strictEqual(
      (await spyGateway.beneficiary.call()),
      beneficiary,
      'The spy did not record the correct beneficiary.',
    );

    assert.strictEqual(
      (await spyGateway.gasPrice.call()).toString(10),
      gasPrice,
      'The spy did not record the correct gas price staked.',
    );

    assert.strictEqual(
      (await spyGateway.gasLimit.call()).toString(10),
      gasLimit,
      'The spy did not record the correct gas limit staked.',
    );

    assert.strictEqual(
      (await spyGateway.nonce.call()).toString(10),
      nonce,
      'The spy did not record the correct nonce staked.',
    );

    assert.strictEqual(
      (await spyGateway.hashLock.call()),
      hashLock,
      'The spy did not record the correct hash lock staked.',
    );


    assert.strictEqual(
      (await spyValueToken.approveFrom.call()),
      stakerProxy.address,
      'The spy did not record the correct approval from.',
    );

    assert.strictEqual(
      (await spyValueToken.approveTo.call()),
      spyGateway.address,
      'The spy did not record the correct approval to.',
    );

    assert.strictEqual(
      (await spyValueToken.approveAmount.call()).toString(10),
      amount,
      'The spy did not record the correct approval amount.',
    );

    // Below assertions concern the tokens:
    assert.strictEqual(
      (await spyBaseToken.approveFrom.call()),
      stakerProxy.address,
      'The spy did not record the correct approval from.',
    );

    assert.strictEqual(
      (await spyBaseToken.approveTo.call()),
      spyGateway.address,
      'The spy did not record the correct approval to.',
    );

    assert.strictEqual(
      (await spyBaseToken.approveAmount.call()).toString(10),
      (await spyGateway.bounty.call()).toString(10),
      'The spy did not record the correct approval amount.',
    );
  });

  it('should return the message hash from the gateway', async () => {
    const messageHash = await stakerProxy.stake.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      spyGateway.address,
      { from: composer },
    );

    assert.strictEqual(
      messageHash,
      (await spyGateway.messageHash.call()),
      'The spy did not record the correct message hash.',
    );
  });

  it('should fail if not called by the composer', async () => {
    await Utils.expectRevert(
      stakerProxy.stake.call(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        spyGateway.address,
        { from: someoneElse },
      ),
      'This function can only be called by the composer.',
    );
  });

  it('should fail if nonces do not match', async () => {
    const wrongNonce = nonce - 5;
    await Utils.expectRevert(
      stakerProxy.stake.call(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        wrongNonce,
        hashLock,
        spyGateway.address,
        { from: composer },
      ),
      'Nonce must match nonce expected by gateway.',
    );
  });
});

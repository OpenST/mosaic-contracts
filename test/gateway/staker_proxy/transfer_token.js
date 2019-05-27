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

const MockToken = artifacts.require('./MockToken.sol');
const StakerProxy = artifacts.require('./StakerProxy.sol');
const config = require('../../test_lib/config');
const Utils = require('../../test_lib/utils');

contract('StakerProxy.transferToken()', (accounts) => {
  const [deployer, owner, someoneElse] = accounts;
  const transferValue = '1000';

  let stakerProxy;

  beforeEach(async () => {
    // Account deployer works, as no composer is queried for `transferToken`.
    stakerProxy = await StakerProxy.new(
      owner,
      { from: deployer },
    );
  });

  it('should send the tokens to the desired recipient', async () => {
    const mockToken = await MockToken.new(config.decimals, { from: deployer });
    await mockToken.transfer(
      stakerProxy.address,
      transferValue,
      { from: deployer },
    );

    await stakerProxy.transferToken(
      mockToken.address,
      someoneElse,
      transferValue,
      { from: owner },
    );

    const balance = await mockToken.balanceOf.call(someoneElse);

    assert.strictEqual(
      balance.toString(10),
      transferValue,
      'The balance of `someoneElse` should equal the transfer value after the transfer.',
    );
  });

  it('should fail if not called by the owner', async () => {
    // Other function arguments are only placeholders as the call will fail on the modifier.
    await Utils.expectRevert(
      stakerProxy.transferToken(
        someoneElse,
        someoneElse,
        transferValue,
        { from: someoneElse },
      ),
      'This function can only be called by the owner.',
    );
  });

  it('should fail if attempting to transfer at token address zero.', async () => {
    // Other function arguments are only placeholders as the call will fail on first require.
    await Utils.expectRevert(
      stakerProxy.transferToken(
        Utils.NULL_ADDRESS,
        someoneElse,
        transferValue,
        { from: owner },
      ),
      'The token address may not be address zero.',
    );
  });
});

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

const SimpleStake = artifacts.require('./SimpleStake.sol');
const MockToken = artifacts.require('./MockToken.sol');

const web3 = require('../../../test/test_lib/web3.js');
const Utils = require('../../../test/test_lib/utils.js');

const zeroAddress = Utils.NULL_ADDRESS;
contract('SimpleStake.constructor()', (accounts) => {
  const gateway = accounts[4];
  let token;
  beforeEach(async () => {
    token = await MockToken.new({ from: accounts[0] });
  });

  it('should pass with correct parameters', async () => {
    const simpleStake = await SimpleStake.new(token.address, gateway, {
      from: accounts[0],
    });

    assert.strictEqual(
      web3.utils.isAddress(simpleStake.address),
      true,
      'Returned value is not a valid address.',
    );

    const eip20Token = await simpleStake.token.call();
    const actualGateway = await simpleStake.gateway.call();

    assert.strictEqual(
      eip20Token,
      token.address,
      'Expected token address is different from actual address.',
    );
    assert.strictEqual(
      gateway,
      actualGateway,
      'Expected gateway address is different from actual address.',
    );
  });

  it('should fail if zero token address is passed', async () => {
    Utils.expectRevert(
      SimpleStake.new(zeroAddress, gateway, { from: accounts[0] }),
      'Token contract address must not be zero.',
    );
  });

  it('should fail if zero gateway address is passed', async () => {
    Utils.expectRevert(
      SimpleStake.new(token.address, zeroAddress, { from: accounts[0] }),
      'Gateway contract address must not be zero.',
    );
  });
});

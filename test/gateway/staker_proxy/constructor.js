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

const StakerProxy = artifacts.require('./StakerProxy.sol');
const web3 = require('../../../test/test_lib/web3.js');

contract('StakerProxy.constructor()', (accounts) => {
  it('should pass with correct parameters', async () => {
    const [deployer, owner] = accounts;
    const stakerProxy = await StakerProxy.new(
      owner,
      { from: deployer },
    );

    assert.strictEqual(
      web3.utils.isAddress(stakerProxy.address),
      true,
      'Deployed staker proxy contract does not have a valid contract address.',
    );

    const composer = await stakerProxy.composer.call();
    const ownerFromContract = await stakerProxy.owner.call();

    assert.strictEqual(
      composer,
      deployer,
      'Expected token address is different from actual address.',
    );
    assert.strictEqual(
      ownerFromContract,
      owner,
      'Expected token address is different from actual address.',
    );
  });
});

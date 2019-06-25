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
const Utils = require('../../test_lib/utils');

contract('StakerProxy.selfDestruct()', (accounts) => {
  const [composer, owner, anyOtherAddress] = accounts;
  let stakerProxy;

  beforeEach(async () => {
    stakerProxy = await StakerProxy.new(
      owner,
      { from: composer },
    );
  });

  it('should allow self destruct by composer ', async () => {
    const response = await stakerProxy.selfDestruct({ from: composer });

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const stakerProxyCode = await web3.eth.getCode(stakerProxy.address);

    assert.strictEqual(
      stakerProxyCode,
      '0x',
      'Staker proxy contract code should be 0x after self destructing',
    );
  });

  it('should not allow self destruct by  non composer address ', async () => {
    await Utils.expectRevert(
      stakerProxy.selfDestruct({ from: anyOtherAddress }),
      'This function can only be called by the composer.',
    );
  });
});

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

const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const Stake = artifacts.require('Stake');

contract('Stake.constructor()', async (accounts) => {
  const tokenAddress = accounts[3];
  const mosaicCoreAddress = accounts[4];
  const zeroAddress = Utils.NULL_ADDRESS;

  it('should accept a correct construction', async () => {
    await Stake.new(tokenAddress, mosaicCoreAddress, new BN('1000'));
  });

  it('should reject a zero token address', async () => {
    await Utils.expectRevert(
      Stake.new(zeroAddress, mosaicCoreAddress, new BN('10')),
      'The address of the staking token must not be zero.',
    );
  });

  it('should reject a zero mosaic core address', async () => {
    await Utils.expectRevert(
      Stake.new(tokenAddress, zeroAddress, new BN('10')),
      'The address of the mosaic core must not be zero.',
    );
  });

  it('should reject a zero minimum weight', async () => {
    await Utils.expectRevert(
      Stake.new(tokenAddress, mosaicCoreAddress, new BN('0')),
      'Minimum weight must be greater than zero.',
    );
  });
});

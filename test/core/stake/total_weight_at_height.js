// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
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
const StakeUtils = require('./helpers/stake_utils.js');

const MockToken = artifacts.require('MockToken');
const Stake = artifacts.require('Stake');

contract('Stake.totalWeightAtHeight()', async (accounts) => {
  const mosaicCoreAccount = accounts[0];
  const minimumWeight = new BN('1');
  let token;
  let stake;

  beforeEach(async () => {
    token = await MockToken.new();
    stake = await Stake.new(token.address, mosaicCoreAccount, minimumWeight);
    await StakeUtils.initializeStake(
      stake,
      token,
      accounts[0],
      [accounts[8]],
      [new BN('2')],
    );
  });

  it('should store the correct accumulative weight', async () => {
    await StakeUtils.deposit(token, stake, accounts[1], new BN('1'));
    await StakeUtils.deposit(token, stake, accounts[2], new BN('2'));
    await stake.closeMetaBlock(new BN(1), { from: mosaicCoreAccount });
    await StakeUtils.deposit(token, stake, accounts[3], new BN('4'));
    await stake.closeMetaBlock(new BN(2), { from: mosaicCoreAccount });
    await StakeUtils.deposit(token, stake, accounts[4], new BN('8'));
    await StakeUtils.deposit(token, stake, accounts[5], new BN('16'));

    // Initial weight is 10 (see `beforeEach()`).
    const expectedWeights = [
      { height: 0, totalWeight: new BN('2') },
      { height: 1, totalWeight: new BN('2') },
      { height: 2, totalWeight: new BN('2') },
      { height: 3, totalWeight: new BN('5') },
      { height: 4, totalWeight: new BN('9') },
      { height: 5, totalWeight: new BN('33') },
      { height: 6, totalWeight: new BN('33') },
      { height: 1000, totalWeight: new BN('33') },
    ];

    for (let i = 0; i < expectedWeights.length; i++) {
      const expectedWeight = expectedWeights[i];
      const totalWeight = await stake.totalWeightAtHeight(
        expectedWeight.height,
      );

      assert(
        totalWeight.eq(expectedWeight.totalWeight),
        `${'The total weight at this height should be different.'
          + ' Expected: '}${expectedWeight.totalWeight.toNumber()} Actual: ${totalWeight.toNumber()}`,
      );
    }
  });
});

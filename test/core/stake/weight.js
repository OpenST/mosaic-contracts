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

contract('Stake.weight()', async (accounts) => {
  const mosaicCoreAccount = accounts[1];
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
      [accounts[1]],
      [new BN('2')],
    );
  });

  it('returns the weight of registered validators', async () => {
    let weight = await stake.weight(1, accounts[1]);
    assert.strictEqual(
      Number(weight),
      2,
      'The weight should equal the deposit.',
    );

    await StakeUtils.deposit(token, stake, accounts[4], new BN('12091985'));
    await StakeUtils.deposit(token, stake, accounts[2], new BN('1337'));

    weight = await stake.weight(3, accounts[4]);
    assert.strictEqual(
      Number(weight),
      12091985,
      'The weight should equal the deposit.',
    );

    weight = await stake.weight(5, accounts[2]);
    assert.strictEqual(
      Number(weight),
      1337,
      'The weight should equal the deposit.',
    );
  });

  it('returns a zero weight for unknown validators', async () => {
    await StakeUtils.deposit(token, stake, accounts[4], new BN('12091985'));
    await StakeUtils.deposit(token, stake, accounts[2], new BN('1337'));

    let weight = await stake.weight(2, accounts[0]);
    assert.strictEqual(
      Number(weight),
      0,
      'The weight should equal the deposit.',
    );

    // Was in the initial set of validators.
    weight = await stake.weight(5, accounts[1]);
    assert.strictEqual(
      Number(weight),
      2,
      'The weight should equal the deposit.',
    );
  });

  it('returns a zero weight for future validators', async () => {
    await StakeUtils.deposit(token, stake, accounts[4], new BN('12091985'));
    await StakeUtils.deposit(token, stake, accounts[2], new BN('1337'));

    let weight = await stake.weight(1, accounts[4]);
    assert.strictEqual(
      Number(weight),
      0,
      'The weight should equal the deposit.',
    );

    weight = await stake.weight(0, accounts[2]);
    assert.strictEqual(
      Number(weight),
      0,
      'The weight should equal the deposit.',
    );
  });
});

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
const StakeUtils = require('./helpers/stake_utils.js');
const Utils = require('../../test_lib/utils.js');

const MockToken = artifacts.require('MockToken');
const Stake = artifacts.require('Stake');

contract('Stake.initialize()', async (accounts) => {
  const tokenDeployer = accounts[0];
  const mosaicCoreAccount = accounts[1];
  const minimumWeight = new BN('32000');
  let token;
  let stake;

  let initialDepositors;
  let initialValidators;
  let initialStakes;

  beforeEach(async () => {
    token = await MockToken.new({ from: tokenDeployer });
    stake = await Stake.new(token.address, mosaicCoreAccount, minimumWeight);

    initialDepositors = [accounts[2], accounts[3], accounts[4]];
    initialValidators = [accounts[5], accounts[6], accounts[7]];
    initialStakes = [new BN('100'), new BN('2000'), new BN('30000')];

    await StakeUtils.approveTransfers(
      stake.address,
      token,
      tokenDeployer,
      initialDepositors,
      initialStakes,
    );
  });

  it('should register an initial set of validators', async () => {
    await stake.initialize(
      initialDepositors,
      initialValidators,
      initialStakes,
    );

    const registeredAddresses = await stake.getValidatorAddresses.call();
    assert.deepEqual(
      initialValidators,
      registeredAddresses,
      'The registered validators must be the ones given to initialize().',
    );

    const count = registeredAddresses.length;
    for (let i = 0; i < count; i++) {
      const address = registeredAddresses[i];
      const validator = await stake.validators.call(address);

      assert.strictEqual(
        validator.depositor,
        initialDepositors[i],
        'Did not register the correct depositor for a validator.',
      );
      assert.strictEqual(
        validator.auxiliaryAddress,
        initialValidators[i],
        'Did not register the correct validator address for a validator.',
      );
      assert(
        validator.stake.eq(initialStakes[i]),
        'Did not register the correct stake for a validator.',
      );
      assert(
        validator.startingHeight.eq(new BN('0')),
        'Did not register a zero starting height for an initial validator.',
      );
      assert.strictEqual(
        validator.evicted,
        false,
        'Did not register a new validator as non-evicted.',
      );
      assert(
        validator.evictionHeight.eq(new BN('0')),
        'Did not register a new validator with a zero eviction height.',
      );
    }
  });

  it('should allow multiple calls if it failed', async () => {
    await Utils.expectRevert(
      stake.initialize([], initialValidators, initialStakes),
    );
    await Utils.expectRevert(
      stake.initialize([], initialValidators, initialStakes),
    );
    await stake.initialize(
      initialDepositors,
      initialValidators,
      initialStakes,
    );
  });

  it('should reject further calls after it succeeded', async () => {
    await stake.initialize(
      initialDepositors,
      initialValidators,
      initialStakes,
    );
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'Initialize can only be called once.',
    );
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'Initialize can only be called once.',
    );
  });

  it('should reject a zero validator address', async () => {
    initialValidators[1] = Utils.NULL_ADDRESS;
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'The validator address may not be zero.',
    );
  });

  it('should reject a zero stake amount', async () => {
    initialStakes[2] = new BN('0');
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'The deposit amount must be greater than zero.',
    );
  });

  it('should reject duplicate validators', async () => {
    initialValidators[2] = initialValidators[0];
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'You must deposit for a validator that is not staked yet.',
    );
  });

  it('should reject a validator where the value cannot be deposited', async () => {
    // Accounts[6] was not approved to transfer tokens in beforeEach().
    initialDepositors[1] = accounts[6];
    // Cannot check error message as revert is caused by SafeMath without
    // message.
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
    );
  });

  it('should reject initial validator arrays of different lengths', async () => {
    await Utils.expectRevert(
      stake.initialize(
        [accounts[2], accounts[3]],
        [accounts[5], accounts[6], accounts[7]],
        [new BN('5000'), new BN('5000'), new BN('5000')],
      ),
      'The initial validator arrays must all have the same length.',
    );
    await Utils.expectRevert(
      stake.initialize(
        [accounts[2], accounts[3]],
        [accounts[5], accounts[6], accounts[7]],
        [new BN('5000'), new BN('5000')],
      ),
      'The initial validator arrays must all have the same length.',
    );
    await Utils.expectRevert(
      stake.initialize(
        [accounts[2], accounts[3]],
        [accounts[5], accounts[6]],
        [new BN('5000'), new BN('5000'), new BN('5000')],
      ),
      'The initial validator arrays must all have the same length.',
    );
  });

  it('should reject initial validators below the minimum weight', async () => {
    initialStakes[2] = new BN('100');
    await Utils.expectRevert(
      stake.initialize(initialDepositors, initialValidators, initialStakes),
      'The total initial weight must be greater than the minimum weight.',
    );
  });
});

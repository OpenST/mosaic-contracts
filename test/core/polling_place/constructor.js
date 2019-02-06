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
const web3 = require('../../test_lib/web3.js');

const Utils = require('../../test_lib/utils.js');

const MockBlockStore = artifacts.require('MockBlockStore');
const PollingPlace = artifacts.require('PollingPlace');

const ValidatorIndexAuxiliaryAddress = 0;
const ValidatorIndexWeight = 1;
const ValidatorIndexEnded = 2;
const ValidatorIndexStartHeight = 3;
const ValidatorIndexEndHeight = 4;

contract('PollingPlace.constructor()', async () => {
  const originCoreIdentifier = '0x0000000000000000000000000000000000000001';
  let originBlockStore;
  const auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';
  let auxiliaryBlockStore;

  beforeEach(async () => {
    originBlockStore = await MockBlockStore.new();
    auxiliaryBlockStore = await MockBlockStore.new();

    await originBlockStore.setVoteValid(true);
    await auxiliaryBlockStore.setVoteValid(true);
    await originBlockStore.setCoreIdentifier(originCoreIdentifier);
    await auxiliaryBlockStore.setCoreIdentifier(auxiliaryCoreIdentifier);
  });

  it('should store a correct list of initial validators', async () => {
    const expectedWeights = {
      addresses: [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000006',
        '0x0000000000000000000000000000000000000007',
        '0x0000000000000000000000000000000000000008',
        '0x0000000000000000000000000000000000000009',
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000a',
        ),
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000b',
        ),
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000c',
        ),
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000d',
        ),
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000e',
        ),
        web3.utils.toChecksumAddress(
          '0x000000000000000000000000000000000000000f',
        ),
        '0x0000000000000000000000000000000000000010',
        '0x0000000000000000000000000000000000000011',
        '0x0000000000000000000000000000000000000012',
        '0x0000000000000000000000000000000000000013',
      ],
      values: [
        new BN('1'),
        new BN('2'),
        new BN('3'),
        new BN('4'),
        new BN('5'),
        new BN('6'),
        new BN('7'),
        new BN('8'),
        new BN('9'),
        new BN('10'),
        new BN('11'),
        new BN('12'),
        new BN('13'),
        new BN('14'),
        new BN('15'),
        new BN('16'),
        new BN('17'),
        new BN('18'),
        new BN('19'),
      ],
    };

    const pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      expectedWeights.addresses,
      expectedWeights.values,
    );

    // Check for all individual weights to be recorded
    for (let i = 0; i < 19; i += 1) {
      const validator = await pollingPlace.validators.call(
        expectedWeights.addresses[i],
      );

      assert.strictEqual(
        validator[ValidatorIndexAuxiliaryAddress],
        expectedWeights.addresses[i],
        'The contract must record the correct auxiliary address of a validator.',
      );
      assert(
        validator[ValidatorIndexWeight].eq(expectedWeights.values[i]),
        'The contract must record the correct staking value address of a validator.',
      );
      assert.strictEqual(
        validator[ValidatorIndexEnded],
        false,
        "The contract must record that a validator hasn't ended on construction.",
      );
      assert(
        validator[ValidatorIndexStartHeight].eq(new BN('0')),
        'The contract must record a zero starting height at construction.',
      );
      assert(
        validator[ValidatorIndexEndHeight].eq(new BN('0')),
        'The contract must record a zero ending height at construction.',
      );
    }

    const totalWeightAtZero = await pollingPlace.totalWeights.call(0);
    assert(
      totalWeightAtZero.eq(new BN('190')),
      'The contract must track the sum of all stakes as total stakes.',
    );
  });

  it('should not accept a zero origin block store', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        Utils.NULL_ADDRESS,
        auxiliaryBlockStore.address,
        [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
        ],
        [new BN('1'), new BN('2')],
      ),
      'The address of the origin block store must not be zero.',
    );
  });

  it('should not accept a zero auxiliary block store', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        Utils.NULL_ADDRESS,
        [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
        ],
        [new BN('1'), new BN('2')],
      ),
      'The address of the auxiliary block store must not be zero.',
    );
  });

  it('should not accept an empty validator set', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        [],
        [],
      ),
      'The count of initial validators must be at least one.',
    );
  });

  it('should not accept two arrays of different length', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
        ],
        [new BN('1')],
      ),
    );

    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        ['0x0000000000000000000000000000000000000001'],
        [new BN('1'), new BN('1')],
      ),
      'The lengths of the addresses and weights arrays must be identical.',
    );
  });

  it('should not accept a zero weight', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
        ],
        [new BN('1'), new BN('0')],
      ),
      'The weight must be greater zero for all validators.',
    );
  });

  it('should not accept a zero address', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        ['0x0000000000000000000000000000000000000001', Utils.NULL_ADDRESS],
        [new BN('1'), new BN('2')],
      ),
      'The auxiliary address of a validator must not be zero.',
    );
  });

  it('should not accept the same address more than once', async () => {
    await Utils.expectRevert(
      PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
          '0x0000000000000000000000000000000000000001',
        ],
        [new BN('1'), new BN('2'), new BN('3')],
      ),
      'There must not be duplicate addresses in the set of validators.',
    );
  });
});

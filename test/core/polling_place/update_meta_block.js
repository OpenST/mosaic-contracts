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

const MockBlockStore = artifacts.require('MockBlockStore');
const PollingPlace = artifacts.require('PollingPlace');
const zeroAddress = Utils.NULL_ADDRESS;

contract('PollingPlace.updateMetaBlock()', async (accounts) => {
  let pollingPlace;
  const originCoreIdentifier = '0x0000000000000000000000000000000000000001';
  let originBlockStore;
  const auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';
  let auxiliaryBlockStore;
  const initialValidators = [accounts[1]];
  const initialWeight = [new BN(1337)];

  async function validateValidators(
    expectedAddress,
    expectedWeight,
    expectedEnded,
    expectedStartHeight,
    expectedEndHeight,
  ) {
    const validator = await pollingPlace.validators.call(expectedAddress);

    assert.strictEqual(
      expectedAddress,
      validator.auxiliaryAddress,
      'Did not store the correct address of the validator.',
    );

    assert(
      expectedWeight.eq(validator.weight),
      'Did not store the correct weight of the validator.',
    );

    assert.strictEqual(
      expectedEnded,
      validator.ended,
      'Did not store the correct ended of the validator.',
    );

    assert(
      expectedStartHeight.eq(validator.startHeight),
      'Did not store the correct start height of the validator.',
    );

    assert(
      expectedEndHeight.eq(validator.endHeight),
      'Did not store the correct end height of the validator.',
    );
  }

  beforeEach(async () => {
    originBlockStore = await MockBlockStore.new();
    auxiliaryBlockStore = await MockBlockStore.new();

    await originBlockStore.setCoreIdentifier(originCoreIdentifier);
    await auxiliaryBlockStore.setCoreIdentifier(auxiliaryCoreIdentifier);

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      initialValidators,
      initialWeight,
    );

    await auxiliaryBlockStore.setPollingPlace(pollingPlace.address);
  });

  it('should update the meta-block', async () => {
    let currentMetaBlockHeight = await pollingPlace.currentMetaBlockHeight.call();

    assert(
      currentMetaBlockHeight.eq(new BN(0)),
      'meta-block height after initialization should be 0.',
    );

    let currentMetaBlockWight = await pollingPlace.totalWeights.call(0);

    assert(
      currentMetaBlockWight.eq(initialWeight[0]),
      `Total weight after initialization should be ${initialWeight[0]}.`,
    );

    const newValidators = [accounts[2], accounts[3]];
    const newWeights = [new BN(100), new BN(150)];

    // Call via Auxiliary block store.
    const result = await auxiliaryBlockStore.updateMetaBlock.call(
      newValidators,
      newWeights,
      new BN(1),
      new BN(1),
    );

    assert(result, 'Update meta block height must return success');

    await auxiliaryBlockStore.updateMetaBlock(
      newValidators,
      newWeights,
      new BN(1),
      new BN(1),
    );

    currentMetaBlockHeight = await pollingPlace.currentMetaBlockHeight.call();

    assert(
      currentMetaBlockHeight.eq(new BN(1)),
      'meta-block height after initialization should be 1.',
    );

    currentMetaBlockWight = await pollingPlace.totalWeights.call(0);

    assert(
      currentMetaBlockWight.eq(initialWeight[0]),
      `Total weight after initialization should be ${initialWeight[0]}.`,
    );

    currentMetaBlockWight = await pollingPlace.totalWeights.call(1);

    assert(
      currentMetaBlockWight.eq(new BN(1587)),
      'Total weight after initialization should be 1587.',
    );

    await validateValidators(
      initialValidators[0],
      initialWeight[0],
      false,
      new BN(0),
      new BN(0),
    );

    await validateValidators(
      newValidators[0],
      newWeights[0],
      false,
      new BN(1),
      new BN(0),
    );

    await validateValidators(
      newValidators[1],
      newWeights[1],
      false,
      new BN(1),
      new BN(0),
    );
  });

  it('should fail when caller is not auxiliary block store', async () => {
    const newValidators = [accounts[2], accounts[3]];
    const newWeights = [new BN(100), new BN(150)];

    await Utils.expectRevert(
      pollingPlace.updateMetaBlock.call(
        newValidators,
        newWeights,
        new BN(1),
        new BN(1),
        { from: accounts[0] },
      ),
      'This method must be called from the registered auxiliary block store.',
    );
  });

  it(
    'should fail when validators and weight are not of same length',
    async () => {
      let newValidators = [accounts[2], accounts[3]];
      let newWeights = [new BN(100)];

      await Utils.expectRevert(
        auxiliaryBlockStore.updateMetaBlock.call(
          newValidators,
          newWeights,
          new BN(1),
          new BN(1),
          { from: accounts[0] },
        ),
        'The lengths of the addresses and weights arrays must be identical.',
      );

      newValidators = [accounts[2]];
      newWeights = [new BN(100), new BN(150)];

      await Utils.expectRevert(
        auxiliaryBlockStore.updateMetaBlock.call(
          newValidators,
          newWeights,
          new BN(1),
          new BN(1),
          { from: accounts[0] },
        ),
        'The lengths of the addresses and weights arrays must be identical.',
      );
    },
  );

  it('should fail when weight of updated validator is zero', async () => {
    const newValidators = [accounts[2], accounts[3]];
    const newWeights = [new BN(100), new BN(0)];

    await Utils.expectRevert(
      auxiliaryBlockStore.updateMetaBlock.call(
        newValidators,
        newWeights,
        new BN(1),
        new BN(1),
        { from: accounts[0] },
      ),
      'The weight must be greater zero for all validators.',
    );
  });

  it('should fail when weight of updated validator is zero', async () => {
    const newValidators = [accounts[2], zeroAddress];
    const newWeights = [new BN(100), new BN(150)];

    await Utils.expectRevert(
      auxiliaryBlockStore.updateMetaBlock.call(
        newValidators,
        newWeights,
        new BN(1),
        new BN(1),
        { from: accounts[0] },
      ),
      'The auxiliary address of a validator must not be zero.',
    );
  });

  it('should fail when validator address is repeated', async () => {
    const newValidators = [accounts[2], accounts[1]];
    const newWeights = [new BN(100), new BN(150)];

    await Utils.expectRevert(
      auxiliaryBlockStore.updateMetaBlock.call(
        newValidators,
        newWeights,
        new BN(1),
        new BN(1),
        { from: accounts[0] },
      ),
      'There must not be duplicate addresses in the set of validators.',
    );
  });

  it('should update the meta-block chain height', async () => {
    const newValidators = [accounts[2]];
    const newWeights = [new BN(100)];

    // valid case
    await auxiliaryBlockStore.updateMetaBlock(
      newValidators,
      newWeights,
      new BN(1),
      new BN(1),
    );

    // valid case
    await auxiliaryBlockStore.updateMetaBlock([], [], new BN(4), new BN(9));

    // valid case
    await auxiliaryBlockStore.updateMetaBlock([], [], new BN(5), new BN(14));

    // invalid case
    await Utils.expectRevert(
      auxiliaryBlockStore.updateMetaBlock.call([], [], new BN(3), new BN(200)),
      'The height of origin must increase with a meta-block opening.',
    );

    // invalid case
    await Utils.expectRevert(
      auxiliaryBlockStore.updateMetaBlock.call([], [], new BN(200), new BN(7)),
      'The height of auxiliary must increase with a meta-block opening.',
    );
  });
});

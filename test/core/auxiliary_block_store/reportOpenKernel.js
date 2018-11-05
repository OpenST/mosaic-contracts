// Copyright 2018 OpenST Ltd.
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

const AuxStoreUtils = require('./helpers/aux_store_utils.js');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const BlockStoreMock = artifacts.require('BlockStoreMock');
const PollingPlace = artifacts.require('MockPollingPlace');

contract('AuxiliaryBlockStore.reportOpenKernel()', async (accounts) => {

  let zeroHash =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  let coreIdentifier = '0x0000000000000000000000000000000000000001';
  let epochLength = new BN('2');
  let pollingPlaceAddress;
  let originBlockStore;
  let testBlocks = TestData.blocks;
  let initialBlockHash = TestData.initialBlock.hash;
  let initialStateRoot = TestData.initialBlock.stateRoot;
  let initialGas = TestData.initialBlock.gas;
  let initialTransactionRoot = TestData.initialBlock.transactionRoot;
  let initialHeight = TestData.initialBlock.height;

  let kernelGateway = accounts[1];
  let auxiliaryBlockStore;
  let pollingPlace;

  let height,
    parent,
    updatedValidators,
    updatedWeights,
    auxiliaryBlockHash,
    genesisKernelHash;

  async function setGenesisKernel() {
    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    genesisKernelHash =
      "0x1269e71d8de310165bf9e59276a45bd7fb413ba33002536edcbcbf57efc9a5fb";

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );
  }

  beforeEach(async () => {
    pollingPlace = await PollingPlace.new();
    pollingPlaceAddress = pollingPlace.address;

    originBlockStore = await BlockStoreMock.new();

    auxiliaryBlockStore = await AuxiliaryBlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      originBlockStore.address,
      initialBlockHash,
      initialStateRoot,
      initialHeight,
      initialGas,
      initialTransactionRoot,
    );

    await pollingPlace.setAuxiliaryBlockStore(auxiliaryBlockStore.address);

    await auxiliaryBlockStore.setKernelGateway(kernelGateway);

    //await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);
  });

  it('should fail when caller is not kernel gateway address', async () => {

    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:accounts[3]},
      ),
      "This method must be called from the registered kernel gateway."
    );

  });

  it('should fail when height is not zero for genesis kernel', async () => {

    height = new BN(1);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Genesis kernel must be at height zero."
    );

  });

  it('should fail when auxiliary block hash is not zero for ' +
    'genesis kernel', async () => {

    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Auxiliary block hash for genesis kernel must be zero."
    );

  });

  it('should pass when all parameters are valid for genesis ' +
    'kernel', async () => {

    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    let kernelHash =
      "0x1269e71d8de310165bf9e59276a45bd7fb413ba33002536edcbcbf57efc9a5fb";

    let result = await auxiliaryBlockStore.reportOpenKernel.call(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    assert.strictEqual(
      result,
      kernelHash,
      `Kernel hash from contract should be ${kernelHash}.`
    );

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    let nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      kernelHash,
      `Next kernel hash from contract should be ${kernelHash}.`
    );

    let activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      zeroHash,
      `Active kernel hash from contract should be ${zeroHash}.`
    );

  });

  it('should fail when kernel is already reported but not ' +
    'activated yet', async () => {

    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Reported kernel is not activated."
    );

  });

  it('should clear the nextKernelHash and update the activeKernelHash after ' +
    'two finalization', async () => {

    await setGenesisKernel();

    let nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      genesisKernelHash,
      `Next kernel hash from contract should be ${genesisKernelHash}.`
    );

    let activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      zeroHash,
      `Active kernel hash from contract should be ${zeroHash}.`
    );

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );

    nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      genesisKernelHash,
      `Next kernel hash from contract should be ${genesisKernelHash}.`
    );

    activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      zeroHash,
      `Active kernel hash from contract should be ${zeroHash}.`
    );

    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );

    nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      genesisKernelHash,
      `Next kernel hash from contract should be ${genesisKernelHash}.`
    );

    activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      zeroHash,
      `Active kernel hash from contract should be ${zeroHash}.`
    );

    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      zeroHash,
      `Next kernel hash from contract should be ${zeroHash}.`
    );

    activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      genesisKernelHash,
      `Active kernel hash from contract should be ${genesisKernelHash}.`
    );

  });

  it('should fail when kernel height is not plus 1 of existing ' +
    'active kernel', async () => {

    await setGenesisKernel();

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );
    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );
    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    height = new BN(2);
    parent = genesisKernelHash;
    updatedValidators = [accounts[5]];
    updatedWeights = [new BN(5)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Kernel height must be equal to open kernel height plus 1."
    );

  });

  it('should fail when parent hash of kernel is not equal to committed ' +
    'meta-block hash', async () => {
    await setGenesisKernel();

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );
    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );
    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    height = new BN(1);
    parent = web3.utils.sha3('random');
    updatedValidators = [accounts[5]];
    updatedWeights = [new BN(5)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Parent hash must be equal to open kernel hash."
    );
  });

  it('should pass when valid kernel is reported', async () => {

    await setGenesisKernel();

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );
    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );
    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    height = new BN(1);
    parent = genesisKernelHash;
    updatedValidators = [accounts[5]];
    updatedWeights = [new BN(5)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');

    let kernelHash =
      '0x5b3d144540d27a4b8911857650ebb039a99d7109dde88b4d74f6b18f82249ad3';

    let result = await auxiliaryBlockStore.reportOpenKernel.call(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    assert.strictEqual(
      result,
      kernelHash,
      `Kernel hash from contract should be ${kernelHash}.`
    );

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    let nextKernelHash = await auxiliaryBlockStore.nextKernelHash.call();

    assert.strictEqual(
      nextKernelHash,
      kernelHash,
      `Next kernel hash from contract should be ${kernelHash}.`
    );

    let activeKernelHash = await auxiliaryBlockStore.activeKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      genesisKernelHash,
      `Active kernel hash from contract should be ${genesisKernelHash}.`
    );

  });

  it('should fail when kernel is already reported', async () => {
    await setGenesisKernel();

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, testBlocks);

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );
    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );
    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    height = new BN(1);
    parent = genesisKernelHash;
    updatedValidators = [accounts[5]];
    updatedWeights = [new BN(5)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    await pollingPlace.justify(
      testBlocks[6].hash,
      testBlocks[8].hash
    );
    await pollingPlace.justify(
      testBlocks[8].hash,
      testBlocks[10].hash
    );

    height = new BN(0);
    parent = web3.utils.sha3('parent');
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = zeroHash;

    await Utils.expectRevert(
      auxiliaryBlockStore.reportOpenKernel.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        {from:kernelGateway},
      ),
      "Kernel must not exist."
    );

  });


  it('should change the kernel observation with dynasty change', async () => {

    let expectedKernelHash = {};

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {1:testBlocks[1]});
    expectedKernelHash[1] = zeroHash;

    await setGenesisKernel();

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {2:testBlocks[2]});
    expectedKernelHash[2] = zeroHash;

    await pollingPlace.justify(
      initialBlockHash,
      testBlocks[2].hash
    );

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {3:testBlocks[3]});
    expectedKernelHash[3] = zeroHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {4:testBlocks[4]});
    expectedKernelHash[4] = zeroHash;

    await pollingPlace.justify(
      testBlocks[2].hash,
      testBlocks[4].hash
    );

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {5:testBlocks[5]});
    expectedKernelHash[5] = zeroHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {6:testBlocks[6]});
    expectedKernelHash[6] = genesisKernelHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {7:testBlocks[7]});
    expectedKernelHash[7] = zeroHash;

    await pollingPlace.justify(
      testBlocks[4].hash,
      testBlocks[6].hash
    );

    height = new BN(1);
    parent = genesisKernelHash;
    updatedValidators = [accounts[5]];
    updatedWeights = [new BN(5)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');
    let kernelHash =
      '0x5b3d144540d27a4b8911857650ebb039a99d7109dde88b4d74f6b18f82249ad3';

    await auxiliaryBlockStore.reportOpenKernel(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      {from:kernelGateway},
    );

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {8:testBlocks[8]});
    expectedKernelHash[8] = genesisKernelHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {9:testBlocks[9]});
    expectedKernelHash[9] = zeroHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {10:testBlocks[10]});

    await pollingPlace.justify(
      testBlocks[6].hash,
      testBlocks[8].hash
    );

    await pollingPlace.justify(
      testBlocks[8].hash,
      testBlocks[10].hash
    );
    expectedKernelHash[10] = kernelHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {11:testBlocks[11]});
    expectedKernelHash[11] = zeroHash;

    await AuxStoreUtils.reportBlocks(auxiliaryBlockStore, {12:testBlocks[12]});
    expectedKernelHash[12] = kernelHash;

    await pollingPlace.justify(
      testBlocks[10].hash,
      testBlocks[12].hash
    );

    for (let i = 1; i<=12; i++){

      let kernelHash = await auxiliaryBlockStore.getKernelHash.call(
        testBlocks[i].hash
      );

      assert.strictEqual(
        expectedKernelHash[i],
        kernelHash,
        `Kernel hash from contract should be ${kernelHash}.`
      );
    }

  });

});

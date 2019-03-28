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
const web3 = require('../../test_lib/web3.js');
const EventDecoder = require('../../test_lib/event_decoder.js');

const KernelGateway = artifacts.require('TestKernelGateway');
const KernelGatewayFail = artifacts.require('TestKernelGatewayFail');
const BlockStore = artifacts.require('MockBlockStore');

contract('KernelGateway.proveBlockOpening()', async (accounts) => {
  const zeroBytes = Utils.ZERO_BYTES32;
  const storageRoot = '0x36ed801abf5678f1506f1fa61e5ccda1f4de53cc7cd03224e3b2a03159b6460d';

  let mosaicCore;
  let kernelGateway;
  let originBlockStore;
  let auxiliaryBlockStore;
  let genesisKernelHash;
  let height;
  let parent;
  let updatedValidators;
  let updatedWeights;
  let auxiliaryBlockHash;
  let storageBranchRlp;
  let originBlockHeight;
  let kernelHash;
  let transitionHash;

  /**
   *
   * @param {Object} Gateway A gateway class, e.g. KernelGateway or KernelGatewayFail.
   */
  const deploy = async (Gateway) => {
    // deploy the kernel gateway
    mosaicCore = accounts[1];
    originBlockStore = await BlockStore.new();
    auxiliaryBlockStore = await BlockStore.new();
    genesisKernelHash = '0xc5d856a8246e84f5c3c715e2a5571961ebe8a02eeba28eb007cd8331fc2c613e';
    kernelGateway = await Gateway.new(
      mosaicCore,
      originBlockStore.address,
      auxiliaryBlockStore.address,
      genesisKernelHash,
    );

    height = new BN(2);
    parent = '0xd07d3b2988d7b7b6a7e44e43ef34fefd5e8a69d58685fddb56b48eef844a7bb4';
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');
    storageBranchRlp = web3.utils.sha3('storageBranchRlp');
    originBlockHeight = 2;

    kernelHash = '0xcb185f95ece0856d2cad7fef058dfe79c3d5df301c28e2618a7b01247c001fa4';
    transitionHash = web3.utils.sha3('transitionHash');

    await kernelGateway.setStorageRoot(storageRoot, originBlockHeight);
    await auxiliaryBlockStore.setKernelGateway(kernelGateway.address);
    await auxiliaryBlockStore.setAuxiliaryTransitionHash(transitionHash);
    await originBlockStore.setLatestBlockHeight(3);
  };

  beforeEach(async () => {
    await deploy(KernelGateway);
  });

  it('should fail when existing open kernel is present', async () => {
    await kernelGateway.setOpenKernelHash(web3.utils.sha3('random'));

    height = new BN(2);
    parent = '0xd07d3b2988d7b7b6a7e44e43ef34fefd5e8a69d58685fddb56b48eef844a7bb4';
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');
    storageBranchRlp = web3.utils.sha3('storageBranchRlp');
    originBlockHeight = 2;

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Existing open kernel is not activated.',
    );
  });

  it('should fail when parent hash is zero', async () => {
    parent = zeroBytes;

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Parent hash must not be zero.',
    );
  });

  it('should fail when parent hash do not match the meta-block hash', async () => {
    parent = web3.utils.sha3('random');

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Parent hash must be equal to previous meta-block hash.',
    );
  });

  it('should fail when height is not equal to +1', async () => {
    height = new BN(5);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Kernel height must be equal to open kernel height plus 1.',
    );
  });

  it('should fail when auxiliary block hash is zero', async () => {
    auxiliaryBlockHash = zeroBytes;

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Auxiliary block hash must not be zero.',
    );
  });

  it(
    'should fail when validators count and validator weight count is'
    + ' not same',
    async () => {
      updatedValidators.push(accounts[5]);

      await Utils.expectRevert(
        kernelGateway.proveBlockOpening.call(
          height,
          parent,
          updatedValidators,
          updatedWeights,
          auxiliaryBlockHash,
          storageBranchRlp,
          originBlockHeight,
        ),
        'The lengths of the addresses and weights arrays must be identical.',
      );
    },
  );

  it('should fail when rlp encoded storage branch is zero', async () => {
    storageBranchRlp = '0x';

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'The storage branch rlp must not be zero.',
    );
  });

  it(
    'should fail when block containing the state root is not finalized',
    async () => {
      originBlockHeight = 4;

      await Utils.expectRevert(
        kernelGateway.proveBlockOpening.call(
          height,
          parent,
          updatedValidators,
          updatedWeights,
          auxiliaryBlockHash,
          storageBranchRlp,
          originBlockHeight,
        ),
        'The block containing the state root must be finalized.',
      );
    },
  );

  it('should fail when storage root is zero', async () => {
    originBlockHeight = new BN(1);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'The storage root must not be zero.',
    );
  });

  it('should fail when storage proof is invalid', async () => {
    await deploy(KernelGatewayFail);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Storage proof must be verified.',
    );
  });

  it('should fail when auxiliary block hash is not valid', async () => {
    await auxiliaryBlockStore.setAuxiliaryTransitionHash(zeroBytes);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        originBlockHeight,
      ),
      'Parent hash must be equal to previous meta-block hash.',
    );
  });

  it('should pass for valid input data', async () => {
    const result = await kernelGateway.proveBlockOpening.call(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      storageBranchRlp,
      originBlockHeight,
    );

    assert(result, 'Proof of kernel opening failed');
  });

  it('should emit event', async () => {
    await auxiliaryBlockStore.setCurrentDynasty(5);

    const tx = await kernelGateway.proveBlockOpening(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      storageBranchRlp,
      originBlockHeight,
    );

    const event = EventDecoder.getEvents(tx, kernelGateway);

    assert(
      event.OpenKernelProven !== undefined,
      'Event `OpenKernelProven` must be emitted.',
    );

    const eventData = event.OpenKernelProven;

    const originCoreIdentifier = await originBlockStore.getCoreIdentifier.call();
    assert.strictEqual(
      eventData._originCoreIdentifier,
      originCoreIdentifier,
      `Origin block store core identifier must be equal to ${originCoreIdentifier}`,
    );

    const auxiliaryCoreIdentifier = await auxiliaryBlockStore.getCoreIdentifier.call();
    assert.strictEqual(
      eventData._auxiliaryCoreIdentifier,
      auxiliaryCoreIdentifier,
      `Auxiliary block store core identifier must be equal ${auxiliaryCoreIdentifier}`,
    );

    assert(
      eventData._metaBlockHeight.eq(height),
      `Meta-block height from event must be equal to ${height}`,
    );

    assert.strictEqual(
      eventData._parent,
      parent,
      `Parent hash from event must be equal to ${parent}`,
    );

    assert.strictEqual(
      eventData._kernelHash,
      kernelHash,
      `Kernel hash from event must be equal to ${kernelHash}`,
    );

    assert(
      eventData._activationDynasty.eqn(7),
      'Activation dynasty must be equal to 7',
    );
  });
});

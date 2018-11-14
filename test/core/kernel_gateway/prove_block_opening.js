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

const Utils = require('../../test_lib/utils.js');
const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const testData = require('../../data/proof');
const KernelGateway = artifacts.require('MockKernelGateway');
const BlockStore = artifacts.require('BlockStoreMock');


contract('KernelGateway.proveBlockOpening()', async (accounts) => {

  const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";
  let originCore, kernelGateway, originBlockStore, auxiliaryBlockStore, genesisKernelHash;

  let height,
    parent,
    updatedValidators,
    updatedWeights,
    auxiliaryBlockHash,
    storageBranchRlp,
    accountRlp,
    accountBranchRlp,
    originBlockHeight,
    kernelHash,
    transitionHash;

  async function setAccountProof(isValid) {
    accountRlp = testData.account.rlpEncodedAccount;
    let hashedAccount = "0x589b8a2a740936d7fd4bfa15532ab33ad68a1083da31609e2a3bd9ebcbd04002";
    let encodedPath = await kernelGateway.encodedOriginCorePath();
    accountBranchRlp = testData.account.rlpParentNodes;
    let stateRoot = "0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f850";

    await originBlockStore.setStateRoot(stateRoot);

    await kernelGateway.setResult(
      hashedAccount,
      encodedPath,
      accountBranchRlp,
      stateRoot,
      isValid
    );
  }

  async function setStorageProof(kernelHash, isValid) {
    await kernelGateway.setResult(
      web3.utils.soliditySha3({type: 'bytes32', value:kernelHash}),
      '0x036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db0',
      storageBranchRlp,
      '0x36ed801abf5678f1506f1fa61e5ccda1f4de53cc7cd03224e3b2a03159b6460d',
      isValid
    );
  }

  beforeEach(async function () {

    // deploy the kernel gateway
    originCore = accounts[1];
    originBlockStore = await BlockStore.new();
    auxiliaryBlockStore = await BlockStore.new();
    genesisKernelHash =
      "0xc5d856a8246e84f5c3c715e2a5571961ebe8a02eeba28eb007cd8331fc2c613e";
    kernelGateway = await KernelGateway.new(
      originCore,
      originBlockStore.address,
      auxiliaryBlockStore.address,
      genesisKernelHash,
    );

    height = new BN(2);
    parent = "0xd07d3b2988d7b7b6a7e44e43ef34fefd5e8a69d58685fddb56b48eef844a7bb4";
    updatedValidators = [accounts[3], accounts[4]];
    updatedWeights = [new BN(3), new BN(4)];
    auxiliaryBlockHash = web3.utils.sha3('auxiliaryBlockHash');
    storageBranchRlp = web3.utils.sha3('storageBranchRlp');
    originBlockHeight = 2;

    kernelHash = "0xcb185f95ece0856d2cad7fef058dfe79c3d5df301c28e2618a7b01247c001fa4";
    transitionHash = web3.utils.sha3('transitionHash');

    await setAccountProof(true);
    await setStorageProof(kernelHash, true);

    await auxiliaryBlockStore.setKernelGateway(kernelGateway.address);
    await auxiliaryBlockStore.setTransitionHash(transitionHash);
    await originBlockStore.setLatestBlockHeight(3);

  });

  it('should fail when existing open kernel is present', async () => {

    await kernelGateway.setOpenKernelHash(web3.utils.sha3('random'));

    height = new BN(2);
    parent = "0xd07d3b2988d7b7b6a7e44e43ef34fefd5e8a69d58685fddb56b48eef844a7bb4";
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
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Existing open kernel is not activated.",
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
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Parent hash must not be zero.",
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
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Parent hash must be equal to previous meta-block hash.",
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
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Kernel height must be equal to open kernel height plus 1.",
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
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Auxiliary block hash must not be zero.",
    );

  });

  it('should fail when validators count and validator weight count is' +
    ' not same', async () => {

    updatedValidators.push(accounts[5]);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The lengths of the addresses and weights arrays must be identical.",
    );

  });

  it('should fail when rlp encoded storage branch is zero', async () => {

    storageBranchRlp = "0x";

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The storage branch rlp must not be zero.",
    );

  });

  it('should fail when rlp encoded account is invalid (Not RLP data)', async () => {

    accountRlp = auxiliaryBlockHash;
    let hashedAccount = "0x589b8a2a740936d7fd4bfa15532ab33ad68a1083da31609e2a3bd9ebcbd04002";
    let encodedPath = await kernelGateway.encodedOriginCorePath();
    accountBranchRlp = testData.account.rlpParentNodes;
    let stateRoot = "0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f850";

    await originBlockStore.setStateRoot(stateRoot);

    await kernelGateway.setResult(
      hashedAccount,
      encodedPath,
      accountBranchRlp,
      stateRoot,
      true,
    );

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Returned error: VM Exception while processing transaction: revert",
    );

  });

  it('should fail when rlp encoded account is zero', async () => {

    accountRlp = "0x";

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The RLP encoded account must not be zero.",
    );

  });

  it('should fail when rlp encoded account node path is zero', async () => {

    accountBranchRlp = "0x";

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The RLP encoded account node path must not be zero.",
    );

  });

  it('should fail when block containing the state root is not ' +
    'finalized', async () => {

    originBlockHeight = 4;

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The block containing the state root must be finalized.",
    );

  });

  it('should fail when state root is zero', async () => {

    await originBlockStore.setStateRoot(zeroBytes);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "The State root must not be zero.",
    );
  });

  it('should fail when storage proof is invalid', async () => {

    await setStorageProof(kernelHash, false);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Storage proof must be verified.",
    );

  });

  it('should fail when account proof is invalid', async () => {

    await setAccountProof(false);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Account is not verified.",
    );

  });

  it('should fail when auxiliary block hash is not valid', async () => {

    await auxiliaryBlockStore.setTransitionHash(zeroBytes);

    await Utils.expectRevert(
      kernelGateway.proveBlockOpening.call(
        height,
        parent,
        updatedValidators,
        updatedWeights,
        auxiliaryBlockHash,
        storageBranchRlp,
        accountRlp,
        accountBranchRlp,
        originBlockHeight,
      ),
      "Parent hash must be equal to previous meta-block hash.",
    );

  });

  it('should pass for valid input data', async () => {

    let result = await kernelGateway.proveBlockOpening.call(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      storageBranchRlp,
      accountRlp,
      accountBranchRlp,
      originBlockHeight,
    );

    assert(result, "Proof of kernel opening failed");

  });

  it('should emit event', async () => {

    await auxiliaryBlockStore.setCurrentDynasty(5);

    let tx = await kernelGateway.proveBlockOpening(
      height,
      parent,
      updatedValidators,
      updatedWeights,
      auxiliaryBlockHash,
      storageBranchRlp,
      accountRlp,
      accountBranchRlp,
      originBlockHeight,
    );

    let event = EventDecoder.getEvents(tx, kernelGateway);

    assert(
      event.OpenKernelProven !== undefined,
      "Event `OpenKernelProven` must be emitted.",
    );

    let eventData = event.OpenKernelProven;

    assert.strictEqual(
      eventData.address,
      kernelGateway.address,
      `Address from event must be equal to ${kernelGateway.address}`,
    );

    let originCoreIdentifier = await originBlockStore.getCoreIdentifier.call();
    assert.strictEqual(
      eventData._originCoreIdentifier,
      originCoreIdentifier,
      `Origin block store core identifier must be equal to ${originCoreIdentifier}`,
    );

    let auxiliaryCoreIdentifier = await auxiliaryBlockStore.getCoreIdentifier.call();
    assert.strictEqual(
      eventData._auxiliaryCoreIdentifier,
      auxiliaryCoreIdentifier,
      `Auxiliary block store core identifier must be equal ${auxiliaryCoreIdentifier}`,
    );

    assert.equal(
      eventData._metaBlockHeight,
      height,
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

    assert.equal(
      eventData._activationDynasty,
      7,
      "Activation dynasty must be equal to 7",
    );

  });

});

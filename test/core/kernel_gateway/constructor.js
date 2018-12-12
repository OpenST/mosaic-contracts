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

const KernelGateway = artifacts.require('KernelGateway');
const BlockStoreMock = artifacts.require('BlockStoreMock');

contract('KernelGateway.constructor()', async (accounts) => {

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const zeroBytes =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const originCoreIdentifier = '0x0000000000000000000000000000000000000001';
  const auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';
  const kernelHashIndex = 5;

  let mosaicCore,
    originBlockStore,
    auxiliaryBlockStore,
    kernelHash,
    encodedMosaicCorePath,
    storagePath;

  beforeEach(async function() {

    originBlockStore = await BlockStoreMock.new();
    auxiliaryBlockStore = await BlockStoreMock.new();

    await originBlockStore.setCoreIdentifier(originCoreIdentifier);
    await auxiliaryBlockStore.setCoreIdentifier(auxiliaryCoreIdentifier);

    mosaicCore  = accounts[1];
    kernelHash = web3.utils.sha3('kernelHash');
    encodedMosaicCorePath = web3.utils.sha3(mosaicCore);
    storagePath = web3.utils.sha3(
      '0x0000000000000000000000000000000000000000000000000000000000000005'
    );

  });

  it('should accept a valid construction', async () => {

    let kernelGateway = await KernelGateway.new(
      mosaicCore,
      originBlockStore.address,
      auxiliaryBlockStore.address,
      kernelHash,
    );

    let mosaicCoreAddress = await kernelGateway.mosaicCore.call();
    assert.strictEqual(
      mosaicCore,
      mosaicCoreAddress,
      'The contract did not store the correct mosaic core address.',
    );

    let originBlockStoreAddress = await kernelGateway.originBlockStore.call();
    assert.strictEqual(
      originBlockStore.address,
      originBlockStoreAddress,
      'The contract did not store the correct mosaic block store address.',
    );

    let auxiliaryBlockStoreAddress =
      await kernelGateway.auxiliaryBlockStore.call();

    assert.strictEqual(
      auxiliaryBlockStore.address,
      auxiliaryBlockStoreAddress,
      'The contract did not store the correct auxiliary block store address.',
    );

    let activeKernelHash = await kernelGateway.getActiveKernelHash.call();
    assert.strictEqual(
      activeKernelHash,
      kernelHash,
      'The contract did not store the correct kernel hash.',
    );

    let originIdentifier = await kernelGateway.originCoreIdentifier.call();
    assert.strictEqual(
      originIdentifier,
      originCoreIdentifier,
      'The contract did not store the correct origin core identifier.',
    );

    let auxiliaryIdentifier = await kernelGateway.auxiliaryCoreIdentifier.call();
    assert.strictEqual(
      auxiliaryIdentifier,
      auxiliaryCoreIdentifier,
      'The contract did not store the correct auxiliary core identifier.',
    );

    let cKernelHashIndex = await kernelGateway.KERNEL_HASH_INDEX.call();
    assert.equal(
      kernelHashIndex,
      cKernelHashIndex,
      'The contract did not return correct kernel hash index 5.',
    );

    let cEncodedMosaicCorePath = await kernelGateway.encodedMosaicCorePath.call();
    assert.strictEqual(
      encodedMosaicCorePath,
      cEncodedMosaicCorePath,
      'The contract did not return correct encoded mosaic core path.',
    );


    let cStoragePath = await kernelGateway.storagePath.call();
    assert.strictEqual(
      storagePath,
      cStoragePath,
      'The contract did not return correct storage path.',
    );

  });

  it('should fail when mosaic core address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        zeroAddress,
        originBlockStore.address,
        auxiliaryBlockStore.address,
        kernelHash,
      ),
      "The address of the mosaic core must not be zero.",
    );

  });

  it('should fail when origin block store address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        mosaicCore,
        zeroAddress,
        auxiliaryBlockStore.address,
        kernelHash,
      ),
      "The address of the origin block store must not be zero.",
    );

  });

  it('should fail when auxiliary block store address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        mosaicCore,
        originBlockStore.address,
        zeroAddress,
        kernelHash,
      ),
      "The address of the auxiliary block store must not be zero.",
    );

  });

  it('should fail when kernel hash is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        mosaicCore,
        originBlockStore.address,
        auxiliaryBlockStore.address,
        zeroBytes,
      ),
      "Kernel hash must not be zero.",
    );

  });

});

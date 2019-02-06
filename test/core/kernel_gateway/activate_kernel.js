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
const MockBlockStore = artifacts.require('MockBlockStore');

contract('KernelGateway.activateKernel()', async (accounts) => {
  const zeroBytes = Utils.ZERO_BYTES32;
  const hash = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';

  const randomHash = '0x5fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67';

  const originCoreIdentifier = '0x0000000000000000000000000000000000000001';

  const auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';

  const activationHeight = new BN(1234);

  let kernelGateway;
  let originBlockStore;
  let auxiliaryBlockStore;
  let initialKernelHash;

  beforeEach(async () => {
    initialKernelHash = web3.utils.sha3('kernelHash');
    originBlockStore = await MockBlockStore.new();
    auxiliaryBlockStore = await MockBlockStore.new();

    await originBlockStore.setCoreIdentifier(originCoreIdentifier);
    await auxiliaryBlockStore.setCoreIdentifier(auxiliaryCoreIdentifier);

    kernelGateway = await KernelGateway.new(
      accounts[1],
      originBlockStore.address,
      auxiliaryBlockStore.address,
      initialKernelHash,
    );

    await kernelGateway.setOpenKernelHash(hash);
    await kernelGateway.setOpenKernelActivationHeight(activationHeight);

    await auxiliaryBlockStore.setKernelGateway(kernelGateway.address);
  });

  it('should fail when msg.sender is not auxiliary block store', async () => {
    await Utils.expectRevert(
      kernelGateway.activateKernel.call(hash, { from: accounts[1] }),
      'This method must be called from the registered auxiliary block store.',
    );
  });

  it(
    'should fail when kernel hash is not equal to the open kernel hash',
    async () => {
      await Utils.expectRevert(
        auxiliaryBlockStore.activateKernel.call(randomHash),
        'Kernel hash must be equal to open kernel hash',
      );
    },
  );

  it('should return success for correct open kernel hash', async () => {
    const result = await auxiliaryBlockStore.activateKernel.call(hash);

    assert.strictEqual(result, true, 'The contract must result true.');
  });

  it('should change the open kernel hash to zero on success', async () => {
    let openKernelHash = await kernelGateway.openKernelHash.call();

    assert.strictEqual(
      hash,
      openKernelHash,
      `Initial open kernel hash must be equal to ${hash}`,
    );

    await auxiliaryBlockStore.activateKernel(hash);

    openKernelHash = await kernelGateway.openKernelHash.call();

    assert.strictEqual(
      openKernelHash,
      zeroBytes,
      `Open kernel hash must be equal to ${zeroBytes}`,
    );
  });

  it('should emit `OpenKernelConfirmed` event', async () => {
    const tx = await auxiliaryBlockStore.activateKernel(hash);

    const event = EventDecoder.getEvents(tx, kernelGateway);

    assert(
      event.OpenKernelConfirmed !== undefined,
      'Event `OpenKernelConfirmed` must be emitted.',
    );

    const eventData = event.OpenKernelConfirmed;

    assert.strictEqual(
      eventData._originCoreIdentifier,
      originCoreIdentifier,
      `Origin core identifier from event must be equal to ${originCoreIdentifier}`,
    );

    assert.strictEqual(
      eventData._auxiliaryCoreIdentifier,
      auxiliaryCoreIdentifier,
      `Auxiliary core identifier from event must be equal to ${auxiliaryCoreIdentifier}`,
    );

    assert.strictEqual(
      eventData._kernelHash,
      hash,
      `Kernel hash from event must be equal to ${hash}`,
    );

    assert.equal(
      activationHeight.toNumber(10),
      eventData._currentDynasty,
      `Current dynasty from event must be equal to ${activationHeight}`,
    );
  });

  it('should delete the open kernel object on success', async () => {
    const hash1 = web3.utils.sha3('hash1');
    const hash2 = web3.utils.sha3('hash2');

    await kernelGateway.setKernel(new BN(12), randomHash, [], [], hash1);

    await kernelGateway.setKernel(new BN(13), randomHash, [], [], hash2);

    await kernelGateway.setOpenKernelHash(hash1);
    await auxiliaryBlockStore.activateKernel(hash1);

    let kernelObject = await kernelGateway.kernels.call(hash1);
    assert(
      kernelObject.height.eq(new BN(12)),
      'Initial active kernel object must exists',
    );

    kernelObject = await kernelGateway.kernels.call(hash2);
    assert(
      kernelObject.height.eq(new BN(13)),
      'Initial open kernel object must exists',
    );

    await kernelGateway.setOpenKernelHash(hash2);
    await auxiliaryBlockStore.activateKernel(hash2);

    kernelObject = await kernelGateway.kernels.call(hash1);

    assert(
      kernelObject.height.eq(new BN(0)),
      'Initial open kernel object must exists',
    );

    kernelObject = await kernelGateway.kernels.call(hash2);

    assert(
      kernelObject.height.eq(new BN(13)),
      'Initial open kernel object must exists',
    );

    await kernelGateway.setOpenKernelHash(randomHash);
    await auxiliaryBlockStore.activateKernel(randomHash);

    kernelObject = await kernelGateway.kernels.call(hash2);

    assert(
      kernelObject.height.eq(new BN(0)),
      'Initial open kernel object must exists',
    );
  });
});

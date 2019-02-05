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

const web3 = require('../../test_lib/web3.js');

const KernelGateway = artifacts.require('TestKernelGateway');
const MockBlockStore = artifacts.require('MockBlockStore');

contract('KernelGateway.getActiveKernelHash()', async (accounts) => {
  let kernelGateway;
  let originBlockStore;
  let auxiliaryBlockStore;
  let initialKernelHash;

  beforeEach(async () => {
    initialKernelHash = web3.utils.sha3('kernelHash');
    originBlockStore = await MockBlockStore.new();
    auxiliaryBlockStore = await MockBlockStore.new();

    kernelGateway = await KernelGateway.new(
      accounts[1],
      originBlockStore.address,
      auxiliaryBlockStore.address,
      initialKernelHash,
    );

    await auxiliaryBlockStore.setKernelGateway(kernelGateway.address);
  });

  it('should return initial kernel hash', async () => {
    const activeKernelHash = await kernelGateway.getActiveKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      initialKernelHash,
      'The contract did not return initial kernel hash.',
    );
  });

  it('should return correct kernel hash', async () => {
    const hash = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';

    await kernelGateway.setOpenKernelHash(hash);

    await auxiliaryBlockStore.activateKernel(hash);

    const activeKernelHash = await kernelGateway.getActiveKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      hash,
      'The contract did not return correct hash.',
    );
  });
});

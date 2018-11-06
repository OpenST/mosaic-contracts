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

const KernelGateway = artifacts.require('MockKernelGateway');

contract('KernelGateway.getActiveKernelHash()', async (accounts) => {

  const zeroBytes =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  let kernelGateway, auxiliaryBlockStore;

  beforeEach(async function() {

    auxiliaryBlockStore = accounts[3];

    kernelGateway = await KernelGateway.new(
      accounts[1],
      accounts[2],
      auxiliaryBlockStore,
    );

  });

  it('should return zero hash', async () => {

    let activeKernelHash = await kernelGateway.getActiveKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      zeroBytes,
      'The contract did not return zero hash.'
    );

  });

  it('should return correct kernel hash', async () => {

    let hash =
      "0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca";

    await kernelGateway.setOpenKernelHash(hash);

    await kernelGateway.activateKernel(hash, {from: auxiliaryBlockStore});

    let activeKernelHash = await kernelGateway.getActiveKernelHash.call();

    assert.strictEqual(
      activeKernelHash,
      hash,
      'The contract did not return correct hash.'
    );

  });

});

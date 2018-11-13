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

const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');

const KernelGateway = artifacts.require('MockKernelGateway');
const BlockStoreMock = artifacts.require('BlockStoreMock');

contract('KernelGateway.getUpdatedValidators()', async (accounts) => {

  const zeroBytes =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  const hash =
    "0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca";

  const randomHash =
    "0x5fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67";

  let activationHeight = new BN(1234);

  let kernelGateway, originBlockStore, auxiliaryBlockStore, initialKernelHash;

  beforeEach(async function() {

    initialKernelHash = web3.utils.sha3('kernelHash');
    originBlockStore = await BlockStoreMock.new();
    auxiliaryBlockStore = await BlockStoreMock.new();

    kernelGateway = await KernelGateway.new(
      accounts[1],
      originBlockStore.address,
      auxiliaryBlockStore.address,
      initialKernelHash,
    );

    await auxiliaryBlockStore.setKernelGateway(kernelGateway.address);

  });

  it('should return zero data', async () => {

    let result = await kernelGateway.getOpenKernel.call();

    assert.strictEqual(
      result.kernelHash_,
      zeroBytes,
      `Kernel hash must be zero`,
    );

    assert.equal(
      result.activationHeight_,
      0,
      `activation height must be zero`,
    );

    assert.equal(
      result.updatedValidators_.length,
      0,
      `updated validators must be blank`,
    );

    assert.equal(
      result.updatedWeights_.length,
      0,
      `updated validator weights must be blank`,
    );

  });

  it('should return correct kernel data', async () => {

    let validatorAddresses = [accounts[1], accounts[2]];
    let validatorWeights = [new BN(100), new BN(150)];
    let hash1 = web3.utils.sha3('hash1');

    await kernelGateway.setKernel(
      new BN(12),
      randomHash,
      validatorAddresses,
      validatorWeights,
      hash1,
    );

    await kernelGateway.setOpenKernelHash(hash1);
    await kernelGateway.setOpenKernelActivationHeight(activationHeight);

    let result = await kernelGateway.getOpenKernel.call();

    assert.strictEqual(
      result.kernelHash_,
      hash1,
      `Kernel hash from contract must be equal to ${hash1}`,
    );

    assert.equal(
      result.activationHeight_,
      activationHeight.toNumber(10),
      `activation height from contract must be ${activationHeight}`,
    );

    assert.equal(
      result.updatedValidators_.length,
      2,
      `updated validators count must be 2`,
    );

    assert.equal(
      result.updatedWeights_.length,
      2,
      `updated validators weight count must be 2`,
    );

    for (let i = 0; i < validatorAddresses.length; i++) {
      assert.strictEqual(
        result.updatedValidators_[i],
        validatorAddresses[i],
        `Validator address from contract must be ${validatorAddresses[i]}`,
      );
    }

    for (let i = 0; i < validatorWeights.length; i++) {
      assert(
        result.updatedWeights_[i].eq(validatorWeights[i]),
        `Validator weights from contract must be ${validatorWeights[i]}`,
      );
    }

  });

});

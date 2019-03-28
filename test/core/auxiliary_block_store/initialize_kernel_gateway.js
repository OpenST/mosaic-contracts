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

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');

contract('AuxiliaryBlockStore.initialize()', async (accounts) => {
  const zeroAddress = Utils.NULL_ADDRESS;

  let auxiliaryBlockStore;

  beforeEach(async () => {
    const initialKernelHash = web3.utils.sha3('kernelHash');
    auxiliaryBlockStore = await AuxiliaryBlockStore.new(
      '0x0000000000000000000000000000000000000001',
      10,
      accounts[0],
      accounts[1],
      '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
      '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
      0,
      new BN('21000'),
      '0x5fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67',
      initialKernelHash,
    );
  });

  it('should fail when gateway address is zero', async () => {
    await Utils.expectRevert(
      auxiliaryBlockStore.initialize.call(zeroAddress),
      'Kernel gateway address must not be zero.',
    );
  });

  it('should set kernel gateway address its not already set', async () => {
    await auxiliaryBlockStore.initialize(accounts[2]);

    const gatewayKernelAddress = await auxiliaryBlockStore.kernelGateway.call();

    assert.strictEqual(
      gatewayKernelAddress,
      accounts[2],
      `Kernel gateway address must be ${accounts[2]}.`,
    );
  });

  it('should fail when gateway address is already initialized', async () => {
    await auxiliaryBlockStore.initialize(accounts[2]);

    await Utils.expectRevert(
      auxiliaryBlockStore.initialize.call(accounts[2]),
      'Kernel gateway must not be already initialized.',
    );
  });
});

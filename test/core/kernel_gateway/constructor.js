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

const KernelGateway = artifacts.require('KernelGateway');

contract('KernelGateway.constructor()', async (accounts) => {

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let originCore, originBlockStore, auxiliaryBlockStore;

  beforeEach(async function() {
    originCore  = accounts[1];
    originBlockStore = accounts[2];
    auxiliaryBlockStore = accounts[3];
  });

  it('should accept a valid construction', async () => {

    let kernelGateway = await KernelGateway.new(
      originCore,
      originBlockStore,
      auxiliaryBlockStore
    );

    let originCoreAddress = await kernelGateway.originCore.call();
    assert.strictEqual(
      originCore,
      originCoreAddress,
      'The contract did not store the correct origin core address.'
    );

    let originBlockStoreAddress = await kernelGateway.originBlockStore.call();
    assert.strictEqual(
      originBlockStoreAddress,
      originBlockStore,
      'The contract did not store the correct origin block store address.'
    );

    let auxiliaryBlockStoreAddress =
      await kernelGateway.auxiliaryBlockStore.call();

    assert.strictEqual(
      auxiliaryBlockStoreAddress,
      auxiliaryBlockStore,
      'The contract did not store the correct auxiliary block store address.'
    );



    let storagePath = await kernelGateway.storagePath.call();
    let encodedOriginCorePath = await kernelGateway.encodedOriginCorePath.call();
    console.log("storagePath: ",storagePath);
    console.log("encodedOriginCorePath: ",encodedOriginCorePath);


    // assert.strictEqual(
    //   storagePath,
    //   auxiliaryBlockStore,
    //   'The contract did not store the correct storage path.'
    // );
    //
    //
    // assert.strictEqual(
    //   encodedOriginCorePath,
    //   auxiliaryBlockStore,
    //   'The contract did not store the correct storage path.'
    // );


  });

  it('should fail when origin core address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        zeroAddress,
        originBlockStore,
        auxiliaryBlockStore
      ),
      "The address of the origin core must not be zero."
    );

  });

  it('should fail when origin block store address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        originCore,
        zeroAddress,
        auxiliaryBlockStore
      ),
      "The address of the origin block store must not be zero."
    );

  });

  it('should fail when auxiliary block store address is zero', async () => {

    await Utils.expectRevert(
      KernelGateway.new(
        originCore,
        originBlockStore,
        zeroAddress
      ),
      "The address of the auxiliary block store must not be zero."
    );

  });

});

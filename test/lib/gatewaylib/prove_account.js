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

const GatewayLib = artifacts.require('GatewayLib');

const StubData = require('../../data/proof.json');
const Utils = require('../../test_lib/utils.js');

contract('GatewayLib.proveAccount()', async () => {
  let gatewayLib;
  let accountProof;
  let encodedAccountValue;
  let path;
  let stateRoot;
  let expectedStorageRoot;

  beforeEach(async () => {
    gatewayLib = await GatewayLib.deployed();

    path = StubData.account.hashedPath;
    accountProof = StubData.account.rlpParentNodes;
    encodedAccountValue = StubData.account.rlpAccount;
    stateRoot = StubData.account.stateRoot;
    expectedStorageRoot = StubData.account.storageRoot;
  });

  it('should return correct storage root for correct account proof', async () => {
    const storageRoot = await gatewayLib.proveAccount(
      encodedAccountValue,
      accountProof,
      path,
      stateRoot,
    );

    assert.strictEqual(
      storageRoot,
      expectedStorageRoot,
      'Expected storage root is different from actual.',
    );
  });

  it('should fail for wrong state root', async () => {
    stateRoot = web3.utils.sha3('dummy state root');

    await Utils.expectRevert(
      gatewayLib.proveAccount(
        encodedAccountValue,
        accountProof,
        path,
        stateRoot,
      ),
      'Account proof is not verified.',
    );
  });

  it('should fail for wrong path', async () => {
    path = web3.utils.sha3('dummy path');

    await Utils.expectRevert(
      gatewayLib.proveAccount(
        encodedAccountValue,
        accountProof,
        path,
        stateRoot,
      ),
      'Account proof is not verified.',
    );
  });

  it('should fail for invalid account proof', async () => {
    accountProof = web3.utils.sha3('dummy proof');

    await Utils.expectRevert(
      gatewayLib.proveAccount(
        encodedAccountValue,
        accountProof,
        path,
        stateRoot,
      ),
      'Account proof is not verified.',
    );
  });

  it('should fail for invalid account value', async () => {
    encodedAccountValue = web3.utils.sha3('invalid account value');

    await Utils.expectRevert(
      gatewayLib.proveAccount(
        encodedAccountValue,
        accountProof,
        path,
        stateRoot,
      ),
      'VM Exception while processing transaction',
    );
  });
});

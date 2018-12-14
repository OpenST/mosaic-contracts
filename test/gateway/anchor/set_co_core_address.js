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

const Anchor = artifacts.require("./Anchor.sol");
const MockMembersManager = artifacts.require('MockMembersManager.sol');
const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('Anchor.setCoCoreAddress()', function (accounts) {

  let remoteChainId,
    blockHeight,
    stateRoot,
    membersManager,
    anchor,
    owner,
    worker,
    coCoreAddress;

  beforeEach(async function () {

    owner = accounts[2];
    worker = accounts[3];
    remoteChainId = new BN(1410);
    blockHeight = new BN(5);
    stateRoot = web3.utils.sha3("dummy_state_root");
    membersManager = await MockMembersManager.new(owner, worker);
    coCoreAddress = accounts[6];
    
      anchor = await Anchor.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      membersManager.address,
    );

  });

  it('should fail when coCore address is zero', async () => {

    coCoreAddress = NullAddress;

    await Utils.expectRevert(
        anchor.setCoCoreAddress(coCoreAddress, { from: owner }),
      'Co-Core address must not be 0.',
    );

  });

  it('should fail when caller is not organisation owner', async () => {

    let notOwner = accounts[7];

    await Utils.expectRevert(
        anchor.setCoCoreAddress(coCoreAddress, { from: notOwner }),
      'Only the organization is allowed to call this method.',
    );

  });

  it('should pass with correct params', async () => {

    let result = await anchor.setCoCoreAddress.call(
      coCoreAddress,
      { from: owner },
    );

    assert.strictEqual(
      result,
      true,
      'Return value of setCoCoreAddress must be true.',
    );

    await anchor.setCoCoreAddress(coCoreAddress, { from: owner });

    let coCore = await anchor.coCore.call();

    assert.strictEqual(
      coCore,
      coCoreAddress,
      `CoCore address must be equal to ${coCoreAddress}.`,
    );

  });

  it('should fail to set coCore address if it\'s already set', async () => {

    await anchor.setCoCoreAddress(coCoreAddress, { from: owner });

    await Utils.expectRevert(
        anchor.setCoCoreAddress(coCoreAddress, { from: owner }),
      'Co-Core has already been set and cannot be updated.',
    );

  });

});

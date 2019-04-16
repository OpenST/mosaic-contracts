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

const MockOrganization = artifacts.require('MockOrganization.sol');
const Anchor = artifacts.require('./Anchor.sol');
const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = Utils.NULL_ADDRESS;

contract('Anchor.setCoAnchorAddress()', (accounts) => {
  let remoteChainId;
  let blockHeight;
  let stateRoot;
  let maxNumberOfStateRoots;
  let organization;
  let anchor;
  let owner;
  let worker;
  let coAnchorAddress;

  beforeEach(async () => {
    owner = accounts[2];
    worker = accounts[3];
    remoteChainId = new BN(1410);
    blockHeight = new BN(5);
    stateRoot = web3.utils.sha3('dummy_state_root');
    maxNumberOfStateRoots = new BN(10);
    organization = await MockOrganization.new(owner, worker);
    coCoreAddress = accounts[6];
    coAnchorAddress = accounts[6];

    anchor = await Anchor.new(
      remoteChainId,
      blockHeight,
      stateRoot,
      maxNumberOfStateRoots,
      organization.address,
    );
  });

  it('should fail when coAnchor address is zero', async () => {
    coAnchorAddress = NullAddress;

    await Utils.expectRevert(
      anchor.setCoAnchorAddress(coAnchorAddress, { from: owner }),
      'Co-Anchor address must not be 0.',
    );
  });

  it('should fail when caller is not organisation owner', async () => {
    const notOwner = accounts[7];

    await Utils.expectRevert(
      anchor.setCoAnchorAddress(coAnchorAddress, { from: notOwner }),
      'Only the organization is allowed to call this method.',
    );
  });

  it('should pass with correct params', async () => {
    const result = await anchor.setCoAnchorAddress.call(coAnchorAddress, {
      from: owner,
    });

    assert.strictEqual(
      result,
      true,
      'Return value of setAnchorAddress must be true.',
    );

    await anchor.setCoAnchorAddress(coAnchorAddress, { from: owner });

    const coAnchor = await anchor.coAnchor.call();

    assert.strictEqual(
      coAnchor,
      coAnchorAddress,
      `CoAnchor address must be equal to ${coAnchorAddress}.`,
    );
  });

  it("should fail to set coAnchor address if it's already set", async () => {
    await anchor.setCoAnchorAddress(coAnchorAddress, { from: owner });

    await Utils.expectRevert(
      anchor.setCoAnchorAddress(coAnchorAddress, { from: owner }),
      'Co-Anchor has already been set and cannot be updated.',
    );
  });
});

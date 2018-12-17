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

const UtilityToken = artifacts.require('UtilityToken');
const MockOrganization = artifacts.require('MockOrganization');
const MockEIP20CoGateway = artifacts.require('MockEIP20CoGateway');

const Utils = require("./../../test_lib/utils"),
  EventDecoder = require('../../test_lib/event_decoder.js');

const NullAddress = "0x0000000000000000000000000000000000000000";

const TOKEN_SYMBOL = "UT";
const TOKEN_NAME = "Utility Token";
const TOKEN_DECIMALS = 18;

contract('UtilityToken.setCoGateway() ', function (accounts) {

  let brandedToken, organization, owner, worker, utilityToken, coGateway;

  beforeEach(async function () {
    owner = accounts[2];
    worker = accounts[3];
    brandedToken = accounts[4];
    organization = await MockOrganization.new(owner, worker);

    utilityToken = await UtilityToken.new(
      brandedToken,
      TOKEN_SYMBOL,
      TOKEN_NAME,
      TOKEN_DECIMALS,
      organization.address,
    );

    coGateway = await MockEIP20CoGateway.new();
    await coGateway.setUtilityToken(utilityToken.address);

  });

  it('should fail when called by non organization address', async function () {

    await Utils.expectRevert(
      utilityToken.setCoGateway(coGateway.address, { from: accounts[5] }),
      'Only the organization is allowed to call this method.',
    );

  });

  it('should fail when cogateway address is zero', async function () {

    await Utils.expectRevert(
      utilityToken.setCoGateway(NullAddress, { from: owner }),
      'CoGateway address should not be zero.',
    );

  });

  it('should fail when cogateway address is not linked with current ' +
    'utility token', async function () {

      await coGateway.setUtilityToken(NullAddress);

      await Utils.expectRevert(
        utilityToken.setCoGateway(coGateway.address, { from: owner }),
        'CoGateway should be linked with this utility token.',
      );

    });

  it('should pass with correct params', async function () {

    let result = await utilityToken.setCoGateway.call(
      coGateway.address, { from: owner }
    );

    assert.strictEqual(
      result,
      true,
      'Contract should return true.',
    );

    await utilityToken.setCoGateway(coGateway.address, { from: owner });

    let coGatewayAddress = await utilityToken.coGateway.call();

    assert.strictEqual(
      coGatewayAddress,
      coGateway.address,
      `CoGateway address from contract should be ${coGateway.address}.`,
    );

  });

  it('should fail when cogateway address is already set once', async function () {

    await utilityToken.setCoGateway(coGateway.address, { from: owner });

    await Utils.expectRevert(
      utilityToken.setCoGateway(coGateway.address, { from: owner }),
      'CoGateway address is already set.',
    );

  });

  it('should emit CoGatewaySet event', async function () {

    let tx = await utilityToken.setCoGateway(coGateway.address, { from: owner });

    let event = EventDecoder.getEvents(tx, utilityToken);

    assert.isDefined(
      event.CoGatewaySet,
      'Event `CoGatewaySet` must be emitted.',
    );

    let eventData = event.CoGatewaySet;

    assert.strictEqual(
      eventData._coGateway,
      coGateway.address,
      `The _coGateway address in the event should be equal to ${coGateway.address}.`
    );

  });

});

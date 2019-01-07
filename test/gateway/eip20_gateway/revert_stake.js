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

const Gateway = artifacts.require("./TestEIP20Gateway.sol");
const MockToken = artifacts.require("MockToken");

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

let MessageStatusEnum = messageBus.MessageStatusEnum;
contract('EIP20Gateway.revertStake()', function (accounts) {

  let gateway;
  let mockToken, baseToken;
  let bountyAmount = new BN(100);

  beforeEach(async function () {

    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    let organization = accounts[1];
    let coreAddress = accounts[5];
    let burner = Utils.NULL_ADDRESS;

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization,
      burner,
    );

  });

  it('should fail when messagehash is zero', async function () {

  });

});

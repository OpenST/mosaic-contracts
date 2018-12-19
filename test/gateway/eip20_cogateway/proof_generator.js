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

const EIP20Gateway = artifacts.require("EIP20Gateway");
const Token = artifacts.require("MockEIP20Token");
const BN = require('bn.js');
const Utils = require("./../../test_lib/utils");
const web3 = require('../../../test/test_lib/web3.js');

contract('EIP20Gateway.deploy() ', function (accounts) {

  let gateway, baseToken, token, coreAddress, bountyAmount, burnerAddress, membersManager;


  async function deployEIP20Gateway() {

    token = await Token.new();
    baseToken = await Token.new();
    coreAddress = accounts[2];
    bountyAmount = new BN(0);
    burnerAddress = accounts[3];
    membersManager = accounts[4];

    // Deploy EIP20Gateway.
    gateway = await EIP20Gateway.new(
      token.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      membersManager,
      burnerAddress,
    );
  }

  beforeEach(async function () {
    await deployEIP20Gateway();
  });

  it('stake', async function () {

  });

});

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

const Gateway = artifacts.require("./EIP20Gateway.sol")
const MockMembersManager = artifacts.require('MockMembersManager.sol');

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('EIP20Gateway.activateGateway()', function (accounts) {

    let gateway;
    let coGateway = accounts[5];
    let owner = accounts[2];
    let worker = accounts[3];
    let membersManager;
    let burner = NullAddress;

    beforeEach(async function () {

        let mockToken = accounts[0],
            baseToken = accounts[1],
            dummyStateRootProvider = accounts[2],
            bountyAmount = new BN(100);

        membersManager = await MockMembersManager.new(owner, worker);

        gateway = await Gateway.new(
            mockToken,
            baseToken,
            dummyStateRootProvider,
            bountyAmount,
            membersManager.address,
            burner
        );
    });

    it('should activate if not already activated', async function () {

        let isSuccess = await gateway.activateGateway.call(coGateway, {from: owner});

        assert.strictEqual(
            isSuccess,
            true,
            "Gateway activation failed, activateGateway returned false.",
        );

        await gateway.activateGateway(coGateway, {from: owner});
        let isActivated = await gateway.activated.call();

        assert.strictEqual(
            isActivated,
            true,
            'Activation flag is false but expected as true.'
        );

        let actualCoGateway = await gateway.remoteGateway.call();

        assert.strictEqual(
            coGateway,
            actualCoGateway,
            "Actual cogateway address is different from expected address."
        );

        let actualEncodedGatewayPath = await gateway.encodedGatewayPath.call();
        let expectedEncodedGatewayPath = web3.utils.sha3(coGateway);

        assert.strictEqual(
            expectedEncodedGatewayPath,
            actualEncodedGatewayPath,
            "Actual encoded gateway path address is different from expected."
        );

    });

    it('should not activate if already activated', async function () {

        await gateway.activateGateway(coGateway, {from: owner});

        await Utils.expectRevert(
            gateway.activateGateway(coGateway, {from: owner}),
            'Gateway was already activated once.'
        );
    });

    it('should not activate with zero co-gateway address', async function () {

        await Utils.expectRevert(
            gateway.activateGateway(NullAddress, {from: owner}),
            'Co-gateway address must not be zero.'
        );
    });

    it('should be activated by organization only', async function () {

        await Utils.expectRevert(
            gateway.activateGateway(coGateway, {from: accounts[0]}),
            'Only the organization is allowed to call this method.'
        );
    });
});


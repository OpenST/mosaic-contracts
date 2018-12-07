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

const CoGateway = artifacts.require("EIP20CoGateway");
const MockToken = artifacts.require("MockToken");
const MockMembersManager = artifacts.require('MockMembersManager.sol');

const Utils = require("./../../test_lib/utils"),
    BN = require('bn.js');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('EIP20CoGateway.constructor() ', function (accounts) {


    let valueToken, utilityToken, bountyAmount, coreAddress, owner, worker,
        membersManager, coGateway, gatewayAddress = accounts[6];

    beforeEach(async function () {

        valueToken = await MockToken.new();
        utilityToken = await MockToken.new();
        coreAddress = accounts[1];
        bountyAmount = new BN(100);

        owner = accounts[2];
        worker = accounts[3];
        membersManager = await MockMembersManager.new(owner, worker);
    });

    it('should able to deploy contract with correct parameters.', async function () {
        coGateway = await
            CoGateway.new(
                valueToken.address,
                utilityToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            );

        assert(
            web3.utils.isAddress(coGateway.address),
            'Returned value is not a valid address.'
        );
    });

    it('should initialize coGateway contract with correct parameters.', async function () {
        coGateway = await
            CoGateway.new(
                valueToken.address,
                utilityToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            );

        let valueTokenAddress = await coGateway.valueToken.call();

        assert.strictEqual(
            valueTokenAddress,
            valueToken.address,
            'Invalid valueTokenAddress address from contract.'
        );

        let utilityTokenAddress = await coGateway.utilityToken.call();
        assert.strictEqual(
            utilityTokenAddress,
            utilityToken.address,
            'Invalid bounty token address from contract.'
        );

        let coreAdd = await coGateway.core.call();
        assert.strictEqual(
            coreAdd,
            coreAddress,
            'Invalid core address from contract.'
        );

        let bounty = await coGateway.bounty.call();
        assert(
            bounty.eq(bountyAmount),
            'Invalid bounty amount from contract'
        );

    });

    it('should not deploy contract if value token is passed as zero.', async function () {
        let valueTokenAddress = NullAddress;

        await Utils.expectRevert(
            CoGateway.new(
                valueTokenAddress,
                utilityToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            ),
            'Value token address must not be zero.'
        );
    });

    it('should not deploy contract if utility token is passed as zero.', async function () {
        let utilityTokenAddress = NullAddress;

        await Utils.expectRevert(
            CoGateway.new(
                valueToken.address,
                utilityTokenAddress,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            ),
            'Utility token address must not be zero.'
        );
    });

    it('should not deploy contract if core address is passed as zero.', async function () {
        let coreAddress = NullAddress;

        await Utils.expectRevert(
            CoGateway.new(
                valueToken.address,
                utilityToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            ),
            'Core contract address must not be zero.'
        );

    });

    it('should able to deploy contract with zero bounty.', async function () {
        let bountyAmount = new BN(0);

        coGateway = await
            CoGateway.new(
                valueToken.address,
                utilityToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address,
                gatewayAddress
            );

        assert(
            web3.utils.isAddress(coGateway.address),
            'Returned value is not a valid address.'
        );
    });
});

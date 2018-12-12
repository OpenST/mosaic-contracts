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

const Gateway = artifacts.require("EIP20Gateway");
const MockToken = artifacts.require("MockToken");
const MockMembersManager = artifacts.require('MockMembersManager.sol');

const Utils = require("./../../test_lib/utils"),
    BN = require('bn.js');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('EIP20Gateway.constructor() ', function (accounts) {

    let mockToken, baseToken, bountyAmount, coreAddress, membersManager,
        gateway, owner, worker;

    beforeEach(async function () {

        mockToken = await MockToken.new();
        baseToken = await MockToken.new();
        coreAddress = accounts[1];
        bountyAmount = new BN(100);

        owner = accounts[2];
        worker = accounts[3];
        membersManager = await MockMembersManager.new(owner, worker);
    });

    it('should able to deploy contract with correct parameters.', async function () {
        gateway = await
            Gateway.new(
                mockToken.address,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address
            );

        assert(
            web3.utils.isAddress(gateway.address),
            "Returned value is not a valid address."
        );
    });

    it('should initialize gateway contract with correct parameters.', async function () {
        gateway = await
            Gateway.new(
                mockToken.address,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address
            );

        let tokenAddress = await gateway.token.call();

        assert.equal(
            tokenAddress,
            mockToken.address,
            "Invalid valueTokenAddress address from contract."
        );

        let bountyTokenAdd = await gateway.baseToken.call();
        assert.equal(
            bountyTokenAdd,
            baseToken.address,
            "Invalid bounty token address from contract."
        );

        let coreAdd = await gateway.core.call();
        assert.equal(
            coreAdd,
            coreAddress,
            "Invalid core address from contract"
        );

        let bounty = await gateway.bounty.call();
        assert(
            bounty.eq(bountyAmount),
            "Invalid bounty amount from contract"
        );

        let isActivated = await gateway.activated.call();
        assert(
            !isActivated,
            "Gateway is not deactivated by default."
        );
        
        let storedMembersManager = await gateway.membersManager();
        assert.equal(
          membersManager.address,
          storedMembersManager,
          "Incorrect membersManager from contract"
        );
    });

    it('should not deploy contract if token is passed as zero.', async function () {
        let mockToken = NullAddress;

        await Utils.expectRevert(
            Gateway.new(
                mockToken,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address
            ),
            "Token contract address must not be zero."
        );
    });

    it('should not deploy contract if base token is passed as zero.', async function () {
        let baseTokenAddress = NullAddress;

        await Utils.expectRevert(
            Gateway.new(
                mockToken.address,
                baseTokenAddress,
                coreAddress,
                bountyAmount,
                membersManager.address
            ),
            "Base token contract address for bounty must not be zero."
        );
    });

    it('should not deploy contract if core address is passed as zero.', async function () {
        let coreAddress = NullAddress;

        await Utils.expectRevert(
            Gateway.new(
                mockToken.address,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address
            ),
            "Core contract address must not be zero."
        );

    });
    
    it('should fail when members manager address is passed as zero', async function () {
        let membersManager = NullAddress;
        
        await Utils.expectRevert(
             Gateway.new(
                mockToken.address,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager
            ),
            "MembersManager contract address must not be zero."
        );
        
    });

    it('should able to deploy contract with zero bounty.', async function () {
        let bountyAmount = new BN(0);

        gateway = await
            Gateway.new(
                mockToken.address,
                baseToken.address,
                coreAddress,
                bountyAmount,
                membersManager.address
            );

        assert(
            web3.utils.isAddress(gateway.address),
            "Returned value is not a valid address."
        );
    });
});

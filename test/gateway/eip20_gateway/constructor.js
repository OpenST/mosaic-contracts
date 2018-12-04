const Gateway = artifacts.require("EIP20Gateway");
MockToken = artifacts.require("MockToken");

const Utils = require("./../../test_lib/utils"),
    BN = require('bn.js');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('EIP20Gateway ', function (accounts) {


    describe('constructor', async function () {

        let mockToken, baseToken, bountyAmount, coreAddress, organisation,
            gateway;

        beforeEach(async function () {

            mockToken = await MockToken.new();
            baseToken = await MockToken.new();
            coreAddress = accounts[1];
            bountyAmount = new BN(100);
            organisation = accounts[2];
        });

        it('should able to deploy contract with correct parameters.', async function () {
            gateway = await
                Gateway.new(
                    mockToken.address,
                    baseToken.address,
                    coreAddress,
                    bountyAmount,
                    organisation
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
                    organisation
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

            let orgAdd = await gateway.organisation.call();
            assert.equal(
                orgAdd,
                organisation,
                "Invalid organisationAddress address from contract"
            );

            let isActivated = await gateway.activated.call();
            assert(
                !isActivated,
                "Gateway is not deactivated by default."
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
                    organisation
                )
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
                    organisation
                )
            );

        });

        it('should not deploy contract if organisation address is passed as' +
            ' zero.', async function () {
            let organisation = NullAddress;

            await Utils.expectRevert(
                Gateway.new(
                    mockToken.address,
                    baseToken.address,
                    coreAddress,
                    bountyAmount,
                    organisation
                )
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
                    organisation
                );

            assert(
                web3.utils.isAddress(gateway.address),
                "Returned value is not a valid address."
            );
        });

    });
});
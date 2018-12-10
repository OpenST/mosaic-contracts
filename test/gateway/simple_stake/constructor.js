const SimpleStake = artifacts.require("./SimpleStake.sol");
const MockToken = artifacts.require("./MockToken.sol");

const web3 = require('../../../test/test_lib/web3.js');

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils.js');

const zeroAddress = "0x0000000000000000000000000000000000000000";
contract('SimpleStake.constructor()', function (accounts) {

    const gateway = accounts[4];
    let token;
    beforeEach(async function () {
        token = await MockToken.new({ from: accounts[0] });
    });

    it('should pass with correct parameters', async function () {

        let simpleStake = await SimpleStake.new(
            token.address,
            gateway,
            {from: accounts[0]}
        );

        assert.strictEqual(
            web3.utils.isAddress(simpleStake.address),
            true,
            'Returned value is not a valid address.'
        );

        let eip20Token = await simpleStake.eip20Token.call();
        let actualGateway = await simpleStake.gateway.call();

        assert.strictEqual(
          eip20Token,
          token.address,
          "Expected token address is different from actual address."
        );
        assert.strictEqual(
          gateway,
          actualGateway,
          "Expected gateway address is different from actual address."
        );
    });

    it('should fail if zero token address is passed', async function () {

        Utils.expectRevert(
            SimpleStake.new(
                zeroAddress,
                gateway,
                {from: accounts[0]}
            ),
            "Token contract address must not be zero."
        );

    });

    it('should fail if zero gateway address is passed', async function () {

        Utils.expectRevert(
            SimpleStake.new(
                token.address,
                zeroAddress,
                {from: accounts[0]}
            ),
            "Gateway contract address must not be zero."
        );

    });
});
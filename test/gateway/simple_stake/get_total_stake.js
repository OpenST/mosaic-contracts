const SimpleStake = artifacts.require("./SimpleStake.sol");
const MockToken = artifacts.require("./MockToken.sol");
const BN = require('bn.js');

contract('SimpleStake.getTotalStake()', function (accounts) {

    const gateway = accounts[4];
    let token, simpleStake;
    beforeEach(async function () {
        token = await MockToken.new({from: accounts[0]});

        simpleStake = await SimpleStake.new(
            token.address,
            gateway,
            {from: accounts[0]}
        );

    });

    it('should return zero total staked amount after deployment.', async function () {
        let expectedTotalStakedAmount = new BN(0);

        let totalStakedAmount = await simpleStake.getTotalStake.call();

        assert.strictEqual(
            totalStakedAmount.eq(expectedTotalStakedAmount),
            true,
            'Initial total staked amount is not zero'
        );
    });

    it('should return correct total staked amount.', async function () {
        let expectedTotalStakedAmount = new BN(100);
        await token.transfer(simpleStake.address, expectedTotalStakedAmount, {from: accounts[0]});

        let totalStakedAmount = await simpleStake.getTotalStake.call();

        assert.strictEqual(
            totalStakedAmount.eq(expectedTotalStakedAmount),
            true,
            'Total staked amount is not as expected.'
        );
    });

    it('should return correct total staked amount on multiple stake' +
        ' requests', async function () {
        let expectedTotalStakedAmount = new BN(0);

        let amount = new BN(100);
        expectedTotalStakedAmount = expectedTotalStakedAmount.add(amount);

        await token.transfer(simpleStake.address, amount, {from: accounts[0]});

        amount = new BN(180);
        expectedTotalStakedAmount = expectedTotalStakedAmount.add(amount);

        await token.transfer(simpleStake.address, amount, {from: accounts[0]});

        let totalStakedAmount = await simpleStake.getTotalStake.call();

        assert.strictEqual(
            totalStakedAmount.eq(expectedTotalStakedAmount),
            true,
            'Total staked amount is not as expected.'
        );
    });
});
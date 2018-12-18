'use strict';

const EIP20Gateway = artifacts.require("EIP20Gateway");
const utils = require("../../../test_lib/utils");

/**
 * @constructor
 *
 * @param {Object} gateway Gateway contract object.
 * @param {Object} token EIP20 token contract object.
 * @param {Object} baseToken EIP20 token contract object. This is the base token.
 */
const EIP20GatewayKlass = function (gateway, token, baseToken) {
    this.gateway = gateway;
    this.token = token;
    this.baseToken = baseToken;
};

EIP20GatewayKlass.prototype = {

    /**
     * Asserts all the conditions for stake
     *
     * @param {Object} params All the input params for calling stake function.
     * @param {Object} resultType Expected result success or fail.
     * @param {Object} expectedResults Expected results, returns and events data.
     * @param {Object} txOptions Transaction options.
     *
     */
    stake: async function (
        params,
        resultType,
        expectedResults,
        txOptions
    ) {

        let amount = params.amount,
            beneficiary = params.beneficiary,
            staker = params.staker,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            nonce = params.nonce,
            hashLock = params.hashLock;

        let initialBalance = await this._getBalances(
            staker,
            this.gateway.address,
            txOptions.from
        );

        let bounty = await this.gateway.bounty.call();

        if (resultType === utils.ResultType.FAIL) {
            await utils.expectThrow(this.gateway.stake.call(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                txOptions
                ),
                expectedResults.errorMessage);
        } else {

            let result = await this.gateway.stake.call(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                txOptions
            );

            assert.equal(
                result,
                expectedResults.returns.messageHash,
                "messageHash must match"
            );

            let response = await this.gateway.stake(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                txOptions
            );

            assert.equal(
                response.receipt.status,
                1,
                "Receipt status is unsuccessful"
            );
            let eventData = response.logs;
            utils.validateEvents(eventData, expectedResults.events);
        }

        let finalBalance = await this._getBalances(
            staker,
            this.gateway.address,
        );

        await this._assertBalances(
            initialBalance,
            finalBalance,
            amount,
            bounty,
            resultType
        );

    },

    /**
     * Gets the token balance and base token balance for all the address
     *
     * @param {string} staker Staker address
     * @param {string} gateway Gateway address
     *
     * @return {Object} object containing balances of all the addresses.
     */
    _getBalances: async function (staker, gateway) {

        let stakerTokenBalance = await this.token.balanceOf.call(staker),
            gatewayTokenBalance = await this.token.balanceOf.call(gateway);

        let stakerBaseTokenBalance = await this.baseToken.balanceOf.call(staker),
            gatewayBaseTokenBalance = await this.baseToken.balanceOf.call(gateway);


        let tokenBalance = {
            "staker": stakerTokenBalance,
            "gateway": gatewayTokenBalance,

        };
        let baseTokenBalance = {
            "staker": stakerBaseTokenBalance,
            "gateway": gatewayBaseTokenBalance,
        };

        return {
            token: tokenBalance,
            baseToken: baseTokenBalance
        }

    },

    /**
     * Asserts the balances of staker, and gateway
     *
     * @param {Object} initialBalance Initial balances of staker and gateway
     * @param {Object} currentBalance Current balances of staker and gateway
     * @param {Object} stakeAmount Stake amount (in BN)
     * @param {Object} bountyAmount Bounty amount (in BN)
     * @param {Object} resultType expected result FAIL => 0 and SUCCESS => 1
     *
     */
    _assertBalances: async function (
        initialBalance,
        currentBalance,
        stakeAmount,
        bountyAmount,
        resultType
    ) {

        // Assert the balances
        if (resultType === utils.ResultType.FAIL) {

            assert(
                initialBalance.token.staker.eq(currentBalance.token.staker),
                "Staker balance must be unchanged"
            );

            assert(
                initialBalance.token.gateway.eq(currentBalance.token.gateway),
                "Gateway balance must be unchanged"
            );

            assert(
                initialBalance.baseToken.staker.eq(currentBalance.baseToken.staker),
                "Staker balance for base token must be unchanged"
            );

            assert(
                initialBalance.baseToken.gateway.eq(currentBalance.baseToken.gateway),
                "Gateway balance for base token must be unchanged"
            );

        } else {

            assert(
                currentBalance.token.staker.eq(initialBalance.token.staker.sub(stakeAmount)),
                `Staker token balance must decrease by ${stakeAmount}`
            );

            assert(
                initialBalance.token.gateway.add(stakeAmount).eq(currentBalance.token.gateway),
                `Gateway token balance must increase by ${stakeAmount}`
            );


            assert(
                initialBalance.baseToken.gateway.add(bountyAmount).eq(currentBalance.baseToken.gateway),
                `Gateway base token balance must create by ${bountyAmount.toString(10)}`
            );

            assert(
                initialBalance.baseToken.staker.sub(bountyAmount).eq(currentBalance.baseToken.staker),
                `Staker base token balance must decrease by ${bountyAmount}`
            );

        }
    }

};

module.exports = EIP20GatewayKlass;

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
const EIP20GatewayKlass = function(gateway, token, baseToken) {
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
  stake: async function(
    params,
    resultType,
    expectedResults,
    txOptions ) {

    let amount = params.amount,
      beneficiary = params.beneficiary,
      staker = params.staker,
      gasPrice = params.gasPrice,
      gasLimit = params.gasLimit,
      nonce = params.nonce,
      hashLock = params.hashLock,
      signature = params.signature;

    // Get the initial balances for all the addresses involved.
    let initialStakerTokenBalance = await this.token.balanceOf.call(staker),
      initialGatewayTokenBalance = await this.token.balanceOf.call(
        this.gateway.address
      ),
      initialFacilitatorTokenBalance = await this.token.balanceOf.call(
        txOptions.from
      );

    // Get the initial balances of base token for all the addresses involved.
    let initialStakerBaseTokenBalance = await this.baseToken.balanceOf.call(staker),
      initialGatewayBaseTokenBalance = await this.baseToken.balanceOf.call(
        this.gateway.address
      ),
      initialFacilitatorBaseTokenBalance = await this.baseToken.balanceOf.call(
        txOptions.from
      );

    let bounty = await this.gateway.bounty.call();

    if (resultType == utils.ResultType.FAIL) {
      await utils.expectThrow(this.gateway.stake.call(
        amount,
        beneficiary,
        staker,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        signature,
        txOptions
      ),
        expectedResults.errorMessage);
    } else {

      let result = await this.gateway.stake.call(
        amount,
        beneficiary,
        staker,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        signature,
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
        staker,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        signature,
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

    // Get the final balances for all the addresses involved.
    let stakerTokenBalance = await this.token.balanceOf.call(staker),
      gatewayTokenBalance = await this.token.balanceOf.call(
        this.gateway.address
      ),
      facilitatorTokenBalance = await this.token.balanceOf.call(
        txOptions.from
      );

    // Get the final balances of base token for all the addresses involved.
    let stakerBaseTokenBalance = await this.baseToken.balanceOf.call(staker),
      gatewayBaseTokenBalance = await this.baseToken.balanceOf.call(
        this.gateway.address
      ),
      facilitatorBaseTokenBalance = await this.baseToken.balanceOf.call(
        txOptions.from
      );

    // Assert the balances
    if (resultType == utils.ResultType.FAIL) {

      assert(
        initialStakerTokenBalance.eq(stakerTokenBalance),
        "Staker balance must be unchanged"
      );

      assert(
        initialGatewayTokenBalance.eq(gatewayTokenBalance),
        "Gateway balance must be unchanged"
      );

      assert(
        initialFacilitatorTokenBalance.eq(facilitatorTokenBalance),
        "Facilitator balance must be unchanged"
      );

      assert(
        initialStakerBaseTokenBalance.eq(stakerBaseTokenBalance),
        "Staker balance for base token must be unchanged"
      );

      assert(
        initialGatewayBaseTokenBalance.eq(gatewayBaseTokenBalance),
        "Gateway balance for base token must be unchanged"
      );

      assert(
        initialFacilitatorBaseTokenBalance.eq(facilitatorBaseTokenBalance),
        "Facilitator balance for base token must be unchanged"
      );

    } else {

      assert(
        stakerTokenBalance.eq(initialStakerTokenBalance.sub(amount)),
        `Staker balance must decrease by ${amount}`
      );

      assert(
        initialGatewayTokenBalance.add(amount).eq(gatewayTokenBalance),
        `Gateway balance must increase by ${amount}`
      );

      assert(
        initialFacilitatorTokenBalance.eq(facilitatorTokenBalance),
        "Facilitator balance must be unchanged"
      );

      assert(
        initialStakerBaseTokenBalance.eq(stakerBaseTokenBalance),
        "Staker balance for base token must be unchanged"
      );

      assert(
        initialGatewayBaseTokenBalance.add(bounty).eq(gatewayBaseTokenBalance),
        `Gateway balance must create by ${bounty.toString(10)}`
      );

      assert(
        initialFacilitatorBaseTokenBalance.sub(bounty).eq(facilitatorBaseTokenBalance),
        `Facilitator balance must decrease by ${bounty}`
      );

    }
  }
};

module.exports = EIP20GatewayKlass;

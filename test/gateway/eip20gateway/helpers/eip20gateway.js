'use strict';

const EIP20Gateway = artifacts.require("EIP20Gateway");
const utils = require("../../../test_lib/utils");

/**
 * @constructor
 *
 * @param {object} gateway Gateway contract object.
 * @param {object} token EIP20 token contract object.
 * @param {baseToken} token EIP20 token contract object. This is the base token.
 */
const EIP20GatewayKlass = function(gateway, token, baseToken) {
  const oThis = this;
  oThis.gateway = gateway;
  oThis.token = token;
  oThis.baseToken = baseToken;
};

EIP20GatewayKlass.prototype = {

  /**
   * Asserts all the conditions for stake
   *
   * @param {object} params All the input params for calling stake function.
   * @param {object} resultType Expected result success or fail.
   * @param {object} expectedResults Expected results, returns and events data.
   * @param {object} txOptions Transaction options.
   *
   */
  stake: async function(
    params,
    resultType,
    expectedResults,
    txOptions ) {

    const oThis = this;

    let amount = params.amount,
      beneficiary = params.beneficiary,
      staker = params.staker,
      gasPrice = params.gasPrice,
      gasLimit = params.gasLimit,
      nonce = params.nonce,
      hashLock = params.hashLock,
      signature = params.signature;

    // Get the initial balances for all the addresses involved.
    let initialStakerTokenBalance = await oThis.token.balanceOf.call(staker),
      initialGatewayTokenBalance = await oThis.token.balanceOf.call(
        oThis.gateway.address
      ),
      initialFacilitatorTokenBalance = await oThis.token.balanceOf.call(
        txOptions.from
      );

    // Get the initial balances of base token for all the addresses involved.
    let initialStakerBaseTokenBalance = await oThis.baseToken.balanceOf.call(staker),
      initialGatewayBaseTokenBalance = await oThis.baseToken.balanceOf.call(
        oThis.gateway.address
      ),
      initialFacilitatorBaseTokenBalance = await oThis.baseToken.balanceOf.call(
        txOptions.from
      );

    let bounty = await oThis.gateway.bounty.call();

    if (resultType == utils.ResultType.FAIL) {
      await utils.expectThrow(oThis.gateway.stake.call(
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

      let result = await oThis.gateway.stake.call(
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

      let response = await oThis.gateway.stake(
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
    let stakerTokenBalance = await oThis.token.balanceOf.call(staker),
      gatewayTokenBalance = await oThis.token.balanceOf.call(
        oThis.gateway.address
      ),
      facilitatorTokenBalance = await oThis.token.balanceOf.call(
        txOptions.from
      );

    // Get the final balances of base token for all the addresses involved.
    let stakerBaseTokenBalance = await oThis.baseToken.balanceOf.call(staker),
      gatewayBaseTokenBalance = await oThis.baseToken.balanceOf.call(
        oThis.gateway.address
      ),
      facilitatorBaseTokenBalance = await oThis.baseToken.balanceOf.call(
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

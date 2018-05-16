// Copyright 2017 OpenST Ltd.
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
// Test: BrandedToken_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const OpenSTValue_utils = require('./OpenSTValue_utils.js')
  , OpenSTValue = artifacts.require("./OpenSTValueMock.sol")
  , SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol")
  , Core = artifacts.require("./Core.sol")
  , SimpleStake = artifacts.require("./SimpleStake.sol")
  , Gate = artifacts.require("./Gate.sol")
  ;

const Assert 	= require('assert')
  , BigNumber = require('bignumber.js')
  ;

/// @dev Deploy 
module.exports.deployGate = async (artifacts, accounts) => {

  const chainIdValue = 3
    , chainIdRemote = 1410
    , openSTRemote  = accounts[4]
    , valueToken   = await SimpleToken.new()
    , registrar    = accounts[1]
    , symbol = "ST"
    , name = "Simple Token"
    , conversionRateDecimals = 5
    , conversionRate = new BigNumber(10 * 10**conversionRateDecimals) // conversion rate => 10
    , workers = accounts[2]
    , bounty = 100
  ;

  var core = null
    , openSTValue = null
    , checkUuid = null
  ;


  // Set SimpleToken admin in order to finalize SimpleToken
  await valueToken.setAdminAddress(accounts[1]);
  // SimpleToken must be finalized to permit certain transfers
  assert.ok(await valueToken.finalize({ from: accounts[1] }));
  openSTValue = await OpenSTValue.new(chainIdValue, valueToken.address, registrar);


  core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote);
  await openSTValue.addCore(core.address, { from: registrar });

  checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);

  assert.equal(await openSTValue.registerUtilityToken.call(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar }), checkUuid);
  const result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, 0, checkUuid, { from: registrar });

  // Stake address is returned by UtilityTokenRegistered but verified below rather than by checkUtilityTokenRegisteredEvent
  OpenSTValue_utils.checkUtilityTokenRegisteredEvent(result.logs[0], checkUuid, symbol, name, 18, conversionRate, chainIdRemote, 0);
  var simpleStake = new SimpleStake(result.logs[0].args.stake);

  assert.equal(await simpleStake.uuid.call(), checkUuid);
  assert.equal(await simpleStake.eip20Token.call(), valueToken.address);
  assert.equal(await openSTValue.getUuidsSize.call(), 1);
  assert.equal((await openSTValue.utilityTokens.call(checkUuid))[0], symbol);

  const gate = await Gate.new(workers, bounty, checkUuid, openSTValue.address);

  return {
    valueToken  : valueToken,
    openSTValue : openSTValue,
    uuid: checkUuid,
    gate: gate,
    workers: workers,
    bounty: bounty
  }
};



module.exports.checkRequestStakeEvent = (event, _staker, _amount, _beneficiary) => {
  if (Number.isInteger(_amount)) {
    _amount = new BigNumber(_amount);
  }
  assert.equal(event.event, "StakeRequested");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amount.toNumber(10), _amount.toNumber(10));
  assert.equal(event.args._beneficiary, _beneficiary);
};


module.exports.checkStakeRequestRevertedEvent = (event, _staker, _amount) => {
  if (Number.isInteger(_amount)) {
    _amount = new BigNumber(_amount);
  }
  assert.equal(event.event, "StakeRequestReverted");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amount.toNumber(10), _amount.toNumber(10));
};

module.exports.checkStakeRequestRejectedEvent = (event, _staker, _amount) => {
  if (Number.isInteger(_amount)) {
    _amount = new BigNumber(_amount);
  }
  assert.equal(event.event, "StakeRequestRejected");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amount.toNumber(10), _amount.toNumber(10));
};


module.exports.checkStakeRequestAcceptedEvent = (event, _staker, _amountST, _amountUT, _nonce, _unlockHeight, _stakingIntentHash) => {
  if (Number.isInteger(_amountST)) {
    _amount = new BigNumber(_amountST);
  }
  if (Number.isInteger(_amountUT)) {
    _amount = new BigNumber(_amountUT);
  }
  if (Number.isInteger(_nonce)) {
    _amount = new BigNumber(_nonce);
  }
  if (Number.isInteger(_unlockHeight)) {
    _amount = new BigNumber(_unlockHeight);
  }
  assert.equal(event.event, "StakeRequestAccepted");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amountST.toNumber(10), _amountST.toNumber(10));
  assert.equal(event.args._amountUT.toNumber(10), _amountUT.toNumber(10));
  assert.equal(event.args._nonce.toNumber(10), _nonce.toNumber(10));
  assert.equal(event.args._unlockHeight.toNumber(10), _unlockHeight.toNumber(10));
  assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
};

module.exports.checkProcessedStakeEvent = (event, _staker, _amount) => {
  if (Number.isInteger(_amount)) {
    _amount = new BigNumber(_amount);
  }
  console.log("event: ",event);
  assert.equal(event.event, "ProcessedStake");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amountST.toNumber(10), _amount.toNumber(10));
};




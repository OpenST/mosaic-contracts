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
  , MockToken = artifacts.require("./MockToken.sol")
  , Core = artifacts.require("./Core.sol")
  , SimpleStake = artifacts.require("./SimpleStake.sol")
  , Gateway = artifacts.require("./Gateway.sol")
  , Workers = artifacts.require("./Workers.sol")
  , proof = require('../data/proof')
;

const rootPrefix = "../.."
  , constants = require(rootPrefix + '/test/lib/constants')
;
const Assert  = require('assert')
  , BigNumber = require('bignumber.js')
  ;

/// @dev Deploy 
module.exports.deployGateway = async (artifacts, accounts) => {

  const chainIdValue = 3
    , chainIdRemote = 1410
    , openSTRemote  = accounts[4]
    , valueToken   = await MockToken.new()
    , symbol = "MOCK"
    , name = "Mock Token"
    , conversionRateDecimals = 5
    , conversionRate = new BigNumber(10 * 10**conversionRateDecimals) // conversion rate => 10
    , bounty = 100
    , admin = accounts[3]
    , ops = accounts[1]
    , registrar = accounts[5]
    , ownerAddress = accounts[12]
  ;

  var core = null
    , openSTValue = null
    , checkUuid = null
  ;

  openSTValue = await OpenSTValue.new(chainIdValue, valueToken.address, registrar, constants.VALUE_CHAIN_BLOCK_TIME);


  // Deploy worker contract
  const workers = await Workers.new(valueToken.address)
    , worker1 = accounts[7];
  await workers.setAdminAddress(admin);
  await workers.setOpsAddress(ops);
  await workers.setWorker(worker1, new BigNumber(web3.toWei(10, "ether")), {from:ops});

  core = await Core.new(registrar, chainIdValue, chainIdRemote, openSTRemote, constants.UTILITY_CHAIN_BLOCK_TIME, 0, proof.account.stateRoot, workers.address);

  await openSTValue.addCore(core.address, { from: registrar });

  checkUuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdRemote, openSTRemote, conversionRate, conversionRateDecimals);

  const gateway = await Gateway.new(workers.address, bounty, checkUuid, openSTValue.address, {from:ownerAddress});

  assert.equal(await openSTValue.registerUtilityToken.call(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, gateway.address, checkUuid, { from: registrar }), checkUuid);
  const result = await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdRemote, gateway.address, checkUuid, { from: registrar });

  // Stake address is returned by UtilityTokenRegistered but verified below rather than by checkUtilityTokenRegisteredEvent
  OpenSTValue_utils.checkUtilityTokenRegisteredEvent(result.logs[0], checkUuid, symbol, name, 18, conversionRate, chainIdRemote, gateway.address);
  var simpleStake = new SimpleStake(result.logs[0].args.stake);

  assert.equal(await simpleStake.uuid.call(), checkUuid);
  assert.equal(await simpleStake.eip20Token.call(), valueToken.address);
  assert.equal(await openSTValue.getUuidsSize.call(), 1);
  assert.equal((await openSTValue.utilityTokens.call(checkUuid))[0], symbol);



  return {
    valueToken  : valueToken,
    openSTValue : openSTValue,
    uuid: checkUuid,
    gateway: gateway,
    workers: workers.address,
    bounty: bounty,
    workerAddress1: worker1,
    ownerAddress: ownerAddress
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

module.exports.checkStakeRequestRejectedEvent = (event, _staker, _amount, _reason) => {
  if (Number.isInteger(_amount)) {
    _amount = new BigNumber(_amount);
  }
  if (Number.isInteger(_reason)) {
    _reason = new BigNumber(_reason);
  }
  assert.equal(event.event, "StakeRequestRejected");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amount.toNumber(10), _amount.toNumber(10));
  assert.equal(event.args._reason.toNumber(10), _reason.toNumber(10));
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
  assert.equal(event.event, "ProcessedStake");
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._amountST.toNumber(10), _amount.toNumber(10));
};


module.exports.checkWorkersSetEvent = (event, _workersAddress) => {
  assert.equal(event.event, "WorkersSet");
  assert.equal(event.args._workers, _workersAddress);
};



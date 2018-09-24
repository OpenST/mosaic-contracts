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
// Test: OpenSTUtility_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const BN = require('bn.js');
const rootPrefix = "../.."
  , constants = require(rootPrefix + '/test/lib/constants')
;

var OpenSTUtility = artifacts.require("./OpenSTUtilityMock.sol");
var STPrime = artifacts.require("./STPrime.sol");
var CoreMock = artifacts.require("./CoreMock.sol");
var proof = require(rootPrefix + '/test/data/proof');

const chainIdValue   = 3;
const chainIdUtility = 1410;

/// @dev Deploy OpenSTUtility
module.exports.deployOpenSTUtility = async (artifacts, accounts) => {
    const registrar      = accounts[1];
    const coreForOpenSTUtility = await CoreMock.new(registrar, chainIdValue, chainIdUtility, accounts[10], constants.VALUE_CHAIN_BLOCK_TIME,  0, proof.account.stateRoot, accounts[11]);
    const openSTUtility = await OpenSTUtility.new(chainIdValue, chainIdUtility, registrar, coreForOpenSTUtility.address, constants.UTILITY_CHAIN_BLOCK_TIME);
    const stPrimeAddress = await openSTUtility.simpleTokenPrime.call();
    const stPrime = new STPrime(stPrimeAddress);
    await stPrime.initialize({ from: accounts[11], value: web3.utils.toWei(new BN('800000000'), "ether") });

    return {
        stPrime       : stPrime,
        openSTUtility : openSTUtility
    }
}

// Token address is returned by ProposedBrandedToken but verified elsewhere
module.exports.checkProposedBrandedTokenEvent = (event, _requester, _uuid, _symbol, _name, _conversionRate) => {
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BN(_conversionRate);
	}

	assert.equal(event.event, "ProposedBrandedToken");
	assert.equal(event.args._requester, _requester);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert(event.args._conversionRate.eq(_conversionRate));
}

module.exports.validateProposedBrandedTokenEvent = (event, _requester, _symbol, _name, _conversionRate) => {
  if (Number.isInteger(_conversionRate)) {
    _conversionRate = new BN(_conversionRate);
  }

  assert.equal(event.event, "ProposedBrandedToken");
  assert.equal(event.args._requester, _requester);
  assert.equal(event.args._symbol, _symbol);
  assert.equal(event.args._name, _name);
  assert(event.args._conversionRate.eq(_conversionRate));
}


module.exports.checkRegisteredBrandedTokenEvent = (event, _registrar, _token, _uuid, _symbol, _name, _conversionRate, _requester) => {
	assert.equal(event.event, "RegisteredBrandedToken");
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BN(_conversionRate);
	}

	assert.equal(event.args._registrar, _registrar);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert(event.args._conversionRate.eq(_conversionRate));
	assert.equal(event.args._requester, _requester);
}

module.exports.checkRegisteredBrandedTokenEventOnProtocol = (formattedDecodedEvents, _registrar, _token, _uuid, _symbol, _name, _conversionRate, _requester) => {

  var event = formattedDecodedEvents['RegisteredBrandedToken'];

  assert.notEqual(event, null);

  if (Number.isInteger(_conversionRate)) {
    _conversionRate = new BN(_conversionRate);
  }

  assert.equal(
    web3.utils.toChecksumAddress(_registrar),
    web3.utils.toChecksumAddress(_registrar));
  assert.equal(
    web3.utils.toChecksumAddress(event._token),
    web3.utils.toChecksumAddress(_token)
  );
  assert.equal(event._uuid, _uuid);
  assert.equal(event._symbol, _symbol);
  assert.equal(event._name, _name);
  assert.equal(event._conversionRate, _conversionRate.toNumber());
  assert.equal(
    web3.utils.toChecksumAddress(event._requester),
    web3.utils.toChecksumAddress(_requester)
  );
}

module.exports.checkStakingIntentConfirmedEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amountST, _amountUT, _expirationHeight) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BN(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BN(_amountUT);
	}

	if (Number.isInteger(_expirationHeight)) {
		_expirationHeight = new BN(_expirationHeight);
	}

	assert.equal(event.event, "StakingIntentConfirmed");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert(event.args._amountST.eq(_amountST));
	assert(event.args._amountUT.eq(_amountUT));
	assert(event.args._expirationHeight.eq(_expirationHeight));
}

module.exports.checkStakingIntentConfirmedEventOnProtocol = (formattedDecodedEvents, _uuid, _stakingIntentHash,
	_staker, _beneficiary, _amountST, _amountUT) => {

  var event = formattedDecodedEvents['StakingIntentConfirmed'];

  assert.notEqual(event, null);

	if (Number.isInteger(_amountST)) {
    _amountST = new BN(_amountST);
  }

  if (Number.isInteger(_amountUT)) {
    _amountUT = new BN(_amountUT);
  }

  assert.equal(event._uuid, _uuid);
  assert.equal(event._stakingIntentHash, _stakingIntentHash);
  assert.equal(
    web3.utils.toChecksumAddress(event._staker),
    web3.utils.toChecksumAddress(_staker)
  );
  assert.equal(
    web3.utils.toChecksumAddress(event._beneficiary), 
    web3.utils.toChecksumAddress(_beneficiary)
  );
  assert(_amountST.eq(new BN(event._amountST)));
  assert(_amountUT.eq(new BN(event._amountUT)));
}

module.exports.checkProcessedMintEvent = (event, _uuid, _stakingIntentHash, _token, _staker, _beneficiary, _amount, _unlockSecret) => {
	if (Number.isInteger(_amount)) {
		_amount = new BN(_amount);
	}

	assert.equal(event.event, "ProcessedMint");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert(event.args._amount.eq(_amount));
	assert.equal(event.args._unlockSecret, _unlockSecret);
}

module.exports.checkRedemptionIntentDeclaredEvent = (event, _uuid, _redemptionIntentHash, _token, _redeemer, _nonce, _beneficiary, _amount, _unlockHeight, _chainIdValue) => {
	if (Number.isInteger(_amount)) {
		_amount = new BN(_amount);
	}

	if (Number.isInteger(_nonce)) {
		_nonce = new BN(_nonce);
	}

	if (Number.isInteger(_unlockHeight)) {
		_unlockHeight = new BN(_unlockHeight);
	}

	if (Number.isInteger(_chainIdValue)) {
		_chainIdValue = new BN(_chainIdValue);
	}

	assert.equal(event.event, "RedemptionIntentDeclared");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert(event.args._nonce.eq(_nonce));
	assert(event.args._amount.eq(_amount));
	assert(event.args._unlockHeight.eq(_unlockHeight));
	assert(event.args._chainIdValue.eq(_chainIdValue));
}

module.exports.checkProcessedRedemptionEvent = (event, _uuid, _redemptionIntentHash, _token, _redeemer, _beneficiary, _amount, _unlockSecret) => {
	if (Number.isInteger(_amount)) {
		_amount = new BN(_amount);
	}

	assert.equal(event.event, "ProcessedRedemption");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert(event.args._amount.eq(_amount));
	assert.equal(event.args._unlockSecret, _unlockSecret);
}

module.exports.checkRevertedMintEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amount) => {
	_amount = new BN(_amount);


  assert.equal(event.event, "RevertedMint");
  assert.equal(event.args._uuid, _uuid);
  assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._beneficiary, _beneficiary);
  assert(event.args._amountUT.eq(_amount));
}

module.exports.checkRevertedRedemption = (event, _uuid, _redemptionIntentHash, _redeemer, _beneficiary, _amountUT) => {
  _amountUT = new BN(_amountUT);

	assert.equal(event.event, "RevertedRedemption");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert(event.args._amountUT.eq(_amountUT));

}

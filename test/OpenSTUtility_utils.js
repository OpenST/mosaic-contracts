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

const BigNumber = require('bignumber.js');
var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");
var OpenSTValue = artifacts.require("./OpenSTValueMock.sol");
var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");
var OpenSTUtility = artifacts.require("./OpenSTUtilityMock.sol");
var STPrime = artifacts.require("./STPrime.sol");
var Registrar 	= artifacts.require("./Registrar.sol");
var Workers = artifacts.require("./Workers.sol");
var CoreMock = artifacts.require("./CoreMock.sol");
var openSTValue = artifacts.require("./OpenSTValue.sol");
const chainIdValue   = 3;
const chainIdUtility = 1410;

/// @dev Deploy OpenSTUtility
module.exports.deployOpenSTUtility = async (artifacts, accounts) => {
/*    const registrar      = accounts[1];
    const staker	  	 = accounts[2];
    const amountST		 = new BigNumber(web3.toWei(2, "ether"));
    const admin = accounts[3];
    const ops = accounts[2];
    const deactivationHeight = new BigNumber(web3.toWei(100000000, "ether"));
    console.log("Before SimpleToken Creation");
    const valueToken   = await SimpleToken.new();
    console.log("After SimpleToken Creation");
    console.log("Before Workers Creation");
    const workers = await Workers.new(valueToken.address)
        , worker1 = accounts[7];
    console.log("After Workers Creation");
    await workers.setAdminAddress(admin);

    await workers.setOpsAddress(ops);
    await workers.setWorker(worker1, deactivationHeight, {from:ops});
    console.log("After workers initialization");
    console.log("valueToken",valueToken.address);
    await valueToken.setAdminAddress(accounts[3]);
    // SimpleToken must be finalized to permit certain transfers
    await valueToken.finalize({ from: accounts[3] });
    await valueToken.transfer(staker, amountST);
    console.log("Before openstvalueinstance");
    const openSTValueInstance = await OpenSTValue.new(chainIdValue, valueToken.address, registrar);
    console.log("After openstvalueinstance");
    const coreObject = await Core.new(registrar, chainIdValue, chainIdUtility, openSTValueInstance.address, workers.address);
    console.log("After Core object",coreObject.address);
	const openSTUtility = await OpenSTUtility.new(chainIdValue, chainIdUtility, registrar, "", { gas: 20000000 });
	console.log("After openSTUtility initialization");
    const stPrimeAddress = await openSTUtility.simpleTokenPrime.call();
	const stPrime = new STPrime(stPrimeAddress);

	await stPrime.initialize({ from: accounts[11], value: new BigNumber(web3.toWei(800000000, "ether")) });
    console.log("After st prime initilization");
	return {
		stPrime       : stPrime,
		openSTUtility : openSTUtility
	}
	*/

    const registrar      = accounts[1];


    const coreForOpenSTUtility 		  	 = await CoreMock.new(registrar, chainIdValue, chainIdUtility, accounts[10], accounts[11]);


    const openSTUtility = await OpenSTUtility.new(chainIdValue, chainIdUtility, registrar, coreForOpenSTUtility.address, { gas: 10000000 });


    const stPrimeAddress = await openSTUtility.simpleTokenPrime.call();


    const stPrime = new STPrime(stPrimeAddress);
    console.log("stPrime: ",stPrime.address);

    await stPrime.initialize({ from: accounts[11], value: new BigNumber(web3.toWei(800000000, "ether")) });

    console.log("1");
    return {
        stPrime       : stPrime,
        openSTUtility : openSTUtility
    }
}

// Token address is returned by ProposedBrandedToken but verified elsewhere
module.exports.checkProposedBrandedTokenEvent = (event, _requester, _uuid, _symbol, _name, _conversionRate) => {
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.event, "ProposedBrandedToken");
	assert.equal(event.args._requester, _requester);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate.toNumber());
}

module.exports.validateProposedBrandedTokenEvent = (event, _requester, _symbol, _name, _conversionRate) => {
  if (Number.isInteger(_conversionRate)) {
    _conversionRate = new BigNumber(_conversionRate);
  }

  assert.equal(event.event, "ProposedBrandedToken");
  assert.equal(event.args._requester, _requester);
  assert.equal(event.args._symbol, _symbol);
  assert.equal(event.args._name, _name);
  assert.equal(event.args._conversionRate.toNumber(), _conversionRate.toNumber());
}


module.exports.checkRegisteredBrandedTokenEvent = (event, _registrar, _token, _uuid, _symbol, _name, _conversionRate, _requester) => {
	assert.equal(event.event, "RegisteredBrandedToken");
	if (Number.isInteger(_conversionRate)) {
		_conversionRate = new BigNumber(_conversionRate);
	}

	assert.equal(event.args._registrar, _registrar);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._symbol, _symbol);
	assert.equal(event.args._name, _name);
	assert.equal(event.args._conversionRate.toNumber(), _conversionRate.toNumber());
	assert.equal(event.args._requester, _requester);
}

module.exports.checkRegisteredBrandedTokenEventOnProtocol = (formattedDecodedEvents, _registrar, _token, _uuid, _symbol, _name, _conversionRate, _requester) => {

  var event = formattedDecodedEvents['RegisteredBrandedToken'];

  assert.notEqual(event, null);

  if (Number.isInteger(_conversionRate)) {
    _conversionRate = new BigNumber(_conversionRate);
  }

  assert.equal(event._registrar, _registrar);
  assert.equal(event._token, _token);
  assert.equal(event._uuid, _uuid);
  assert.equal(event._symbol, _symbol);
  assert.equal(event._name, _name);
  assert.equal(event._conversionRate, _conversionRate.toNumber());
  assert.equal(event._requester, _requester);
}

module.exports.checkStakingIntentConfirmedEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amountST, _amountUT, _expirationHeight) => {
	if (Number.isInteger(_amountST)) {
		_amountST = new BigNumber(_amountST);
	}

	if (Number.isInteger(_amountUT)) {
		_amountUT = new BigNumber(_amountUT);
	}

	if (Number.isInteger(_expirationHeight)) {
		_expirationHeight = new BigNumber(_expirationHeight);
	}

	assert.equal(event.event, "StakingIntentConfirmed");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountST.toNumber(), _amountST.toNumber());
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());
	assert.equal(event.args._expirationHeight.toNumber(), _expirationHeight.toNumber());
}

module.exports.checkStakingIntentConfirmedEventOnProtocol = (formattedDecodedEvents, _uuid, _stakingIntentHash,
	_staker, _beneficiary, _amountST, _amountUT) => {

  var event = formattedDecodedEvents['StakingIntentConfirmed'];

  assert.notEqual(event, null);

	if (Number.isInteger(_amountST)) {
    _amountST = new BigNumber(_amountST);
  }

  if (Number.isInteger(_amountUT)) {
    _amountUT = new BigNumber(_amountUT);
  }

  assert.equal(event._uuid, _uuid);
  assert.equal(event._stakingIntentHash, _stakingIntentHash);
  assert.equal(event._staker, _staker);
  assert.equal(event._beneficiary, _beneficiary);
  assert.equal(event._amountST, _amountST.toNumber());
  assert.equal(event._amountUT, _amountUT.toNumber());
}

module.exports.checkProcessedMintEvent = (event, _uuid, _stakingIntentHash, _token, _staker, _beneficiary, _amount, _unlockSecret) => {
	if (Number.isInteger(_amount)) {
		_amount = new BigNumber(_amount);
	}

	assert.equal(event.event, "ProcessedMint");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._staker, _staker);
	assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
	assert.equal(event.args._unlockSecret, _unlockSecret);
}

module.exports.checkRedemptionIntentDeclaredEvent = (event, _uuid, _redemptionIntentHash, _token, _redeemer, _nonce, _beneficiary, _amount, _unlockHeight, _chainIdValue) => {
	if (Number.isInteger(_amount)) {
		_amount = new BigNumber(_amount);
	}

	if (Number.isInteger(_nonce)) {
		_nonce = new BigNumber(_nonce);
	}

	if (Number.isInteger(_unlockHeight)) {
		_unlockHeight = new BigNumber(_unlockHeight);
	}

	if (Number.isInteger(_chainIdValue)) {
		_chainIdValue = new BigNumber(_chainIdValue);
	}

	assert.equal(event.event, "RedemptionIntentDeclared");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._nonce.toNumber(), _nonce.toNumber());
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
	assert.equal(event.args._unlockHeight.toNumber(), _unlockHeight.toNumber());
	assert.equal(event.args._chainIdValue.toNumber(), _chainIdValue.toNumber());
}

module.exports.checkProcessedRedemptionEvent = (event, _uuid, _redemptionIntentHash, _token, _redeemer, _beneficiary, _amount, _unlockSecret) => {
	if (Number.isInteger(_amount)) {
		_amount = new BigNumber(_amount);
	}

	assert.equal(event.event, "ProcessedRedemption");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._token, _token);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amount.toNumber(), _amount.toNumber());
	assert.equal(event.args._unlockSecret, _unlockSecret);
}

module.exports.checkRevertedMintEvent = (event, _uuid, _stakingIntentHash, _staker, _beneficiary, _amount) => {
	_amount = new BigNumber(_amount);


  assert.equal(event.event, "RevertedMint");
  assert.equal(event.args._uuid, _uuid);
  assert.equal(event.args._stakingIntentHash, _stakingIntentHash);
  assert.equal(event.args._staker, _staker);
  assert.equal(event.args._beneficiary, _beneficiary);
  assert.equal(event.args._amountUT.toNumber(), _amount.toNumber());
}

module.exports.checkRevertedRedemption = (event, _uuid, _redemptionIntentHash, _redeemer, _beneficiary, _amountUT) => {
  _amountUT = new BigNumber(_amountUT);

	assert.equal(event.event, "RevertedRedemption");
	assert.equal(event.args._uuid, _uuid);
	assert.equal(event.args._redemptionIntentHash, _redemptionIntentHash);
	assert.equal(event.args._redeemer, _redeemer);
  assert.equal(event.args._beneficiary, _beneficiary);
	assert.equal(event.args._amountUT.toNumber(), _amountUT.toNumber());

}

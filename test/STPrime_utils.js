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
// Test: STPrime_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert 	= require('assert');
const BigNumber = require('bignumber.js');

var Hasher 			= artifacts.require("./Hasher.sol");
var STPrimeConfig 	= artifacts.require("./STPrimeConfig.sol");
var STPrime 		= artifacts.require("./STPrime.sol");

/// @dev Deploy 
module.exports.deploySTPrime = async (artifacts, accounts) => {
	const hasher 				= await Hasher.new();
	const stPrimeConfig 		= await STPrimeConfig.new();
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol 		= accounts[4];
	const conversionRateDecimals	= 5;
	const conversionRate 		= new BigNumber(10 * (10**conversionRateDecimals));	
	const genesisChainIdValue 	= 3;
	const genesisChainIdUtility = 1410;
	const stPrimeSymbol			= await stPrimeConfig.STPRIME_SYMBOL.call();
	const stPrimeName			= await stPrimeConfig.STPRIME_NAME.call();
	const UUID 					= await hasher.hashUuid.call(stPrimeSymbol, stPrimeName, genesisChainIdValue, genesisChainIdUtility, openSTProtocol, conversionRate, conversionRateDecimals);

	const stPrime = await STPrime.new(UUID, genesisChainIdValue, genesisChainIdUtility, conversionRate, conversionRateDecimals, { from: openSTProtocol });

	return {
		stPrime : stPrime
	}
}

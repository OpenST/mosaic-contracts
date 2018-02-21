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

const Assert 	= require('assert');
const BigNumber = require('bignumber.js');

var Hasher 		 = artifacts.require("./Hasher.sol");
var BrandedToken = artifacts.require("./BrandedToken.sol");

/// @dev Deploy 
module.exports.deployBrandedToken = async (artifacts, accounts) => {
	const hasher 				= await Hasher.new();
	/// mock OpenST protocol contract address with an external account
	const openSTProtocol 		= accounts[4];	
  const conversionRateDecimals    = 5;
  const conversionRate    = new BigNumber(10 * (10 ** conversionRateDecimals));
	const genesisChainIdValue 	= 3;
	const genesisChainIdUtility = 1410;
	const UUID 					= await hasher.hashUuid.call("symbol", "name", genesisChainIdValue, genesisChainIdUtility, openSTProtocol, conversionRate, conversionRateDecimals);

   const token = await BrandedToken.new(UUID, "symbol", "name", 18, genesisChainIdValue, genesisChainIdUtility, conversionRate, conversionRateDecimals, { from: openSTProtocol });

   return {
      token : token
   }
}

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

const Assert = require('assert');
const BigNumber = require('bignumber.js');

var BrandedToken = artifacts.require('./BrandedToken.sol');

/// @dev Deploy 
module.exports.deployBrandedToken = async (artifacts, accounts) => {
   /// mock unique identifier for utility token
   const UUID = "0xbce8a3809c9356cf0e5178a2aef207f50df7d32b388c8fceb8e363df00efce31";
   /// mock OpenST protocol contract address with an external account
   const openSTProtocol = accounts[4];

   const token = await BrandedToken.new(openSTProtocol, UUID, "SYMBOL", "Name", 18, { from: accounts[0], gas: 3500000 });

   return {
      token : token
   }
}

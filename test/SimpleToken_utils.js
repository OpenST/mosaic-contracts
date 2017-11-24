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
// Test: SimpleToken_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BigNumber = require('bignumber.js');

var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol");

/// @dev Deploy 
module.exports.deploySimpleToken = async (artifacts, accounts) => {

   const token = await SimpleToken.new({ from: accounts[0], gas: 3500000 });

   return {
      token : token
   }
}

module.exports.checkFinalizedEventGroup = (result) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "Finalized")
}


module.exports.checkBurntEventGroup = (result, _from, _value) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "Burnt")
   assert.equal(event._from, _from)
   assert.equal(event._value, _value)
}
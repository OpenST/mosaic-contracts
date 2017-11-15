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
// test/SimpleToken_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BigNumer = require('bignumber.js');

/// @dev Assert on Transfer event
module.exports.checkTransferEventGroup = (result, _from, _to, _value) => {
   assert.equal(result.logs.length, 1);

   const event = result.logs[0];

   module.exports.checkTransferEvent(event, _from, _to, _value);
}


module.exports.checkTransferEvent = (event, _from, _to, _value) => {
   if (Number.isInteger(_value)) {
      _value = new BigNumber(_value);
   }

   assert.equal(event.event, "Transfer");
   assert.equal(event.args._from, _from);
   assert.equal(event.args._to, _to);
   assert.equal(event.args._value.toNumber(), _value.toNumber());
}

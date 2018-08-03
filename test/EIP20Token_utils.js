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
// Test: EIP20Token_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BigNumber = require('bignumber.js');

var EIP20Token = artifacts.require("./EIP20TokenMock.sol");

/// @dev Deploy 
module.exports.deployEIP20Token = async (artifacts, accounts) => {
  const token = await EIP20Token.new("SYMBOL", "Name", 18, {from: accounts[0]});

  return {
    token: token
  }
}

/// @dev Assert on Transfer event
module.exports.checkTransferEventGroup = (result, _from, _to, _value) => {
  Assert.equal(result.logs.length, 1);

  const event = result.logs[0];

  module.exports.checkTransferEvent(event, _from, _to, _value);
}


module.exports.checkTransferEvent = (event, _from, _to, _value) => {
  let eventBody = event.args;
  assertTransferEvent(event.event, eventBody._from, eventBody._to, eventBody._value.toNumber(), _from, _to, _value)
}

module.exports.checkTransferEventAbiDecoder = (event, _from, _to, _value) => {
  let eventType = Object.keys(event)[0];
  let eventBody = event[eventType];
  assertTransferEvent(eventType, eventBody._from, eventBody._to, eventBody._value, _from, _to, _value)
}

assertTransferEvent = (eventType, actualFrom, actualTo, actualValue, expectedFrom, expectedTo, expectedValue) => {
  if (Number.isInteger(expectedValue)) {
    expectedValue = new BigNumber(expectedValue);
  }
  Assert.equal(eventType, "Transfer");
  Assert.equal(actualFrom, expectedFrom);
  Assert.equal(actualTo, expectedTo);
  Assert.equal(actualValue, expectedValue.toNumber());
}

module.exports.checkApprovalEventGroup = (result, _owner, _spender, _value) => {
  assert.equal(result.logs.length, 1)

  const event = result.logs[0]

  if (Number.isInteger(_value)) {
    _value = new BigNumber(_value)
  }

  assert.equal(event.event, "Approval")
  assert.equal(event.args._owner, _owner)
  assert.equal(event.args._spender, _spender)
  assert.equal(event.args._value.toNumber(), _value.toNumber())
}

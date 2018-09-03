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
// Test: lib/utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');

const NullAddress = "0x0000000000000000000000000000000000000000";

/*
 *  Tracking Gas Usage
 */

const receipts = [];

module.exports.logResponse = (response, description) => {
  receipts.push({
    receipt: response.receipt,
    description: description,
    response: response
  });
}

module.exports.logReceipt = (receipt, description) => {
  receipts.push({
    receipt: receipt,
    description: description,
    response: null
  })
}

module.exports.logTransaction = async (hash, description) => {
  const receipt = await web3.eth.getTransactionReceipt(hash)
  await this.logReceipt(receipt, description)
}

module.exports.printGasStatistics = () => {
  var totalGasUsed = 0

  console.log("      -----------------------------------------------------");
  console.log("      Report gas usage\n");

  for (i = 0; i < receipts.length; i++) {
    const entry = receipts[i]

    totalGasUsed += entry.receipt.gasUsed

    console.log("      " + entry.description.padEnd(45) + entry.receipt.gasUsed)
  }

  console.log("      -----------------------------------------------------")
  console.log("      " + "Total gas logged: ".padEnd(45) + totalGasUsed + "\n")
}

module.exports.clearReceipts = () => {
  receipts.splice(0, receipts.length);
}


/*
 *  General event checks
 */
module.exports.expectNoEvents = (result) => {
  Assert.equal(result.receipt.logs.length, 0, "expected empty array of logs")
}

/*
 *  Basic Ethereum checks
 */

/// @dev Compare to null address
module.exports.isNullAddress = function (address) {
  Assert.strictEqual(typeof address, 'string', `address must be of type 'string'`);
  return (address == NullAddress);
}

/// @dev Expect failure from invalid opcode or out of gas,
///      but returns error instead
module.exports.expectThrow = async (promise) => {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') > -1;

    const outOfGas = error.message.search('out of gas') > -1;

    // Latest TestRPC has trouble with require
    const revertInstead = error.message.search('revert') > -1;

    assert(invalidOpcode || outOfGas || revertInstead, `Expected throw, but got ${error} instead`);

    return;
  }

  assert(false, "Did not throw as expected");
};

/// @dev Expect failure from revert,
///      but returns error instead
module.exports.expectRevert = async (promise) => {
  try {
    await promise;
  } catch (error) {
    // TODO: Truffle v5 will support require messages with web3 1.0 and we can
    //       check for a specific message.
    assert(
      error.message.search('revert') > -1,
      'The contract should revert. Instead: ' + error.message
    );

    return;
  }

  assert(false, "Did not revert as expected.");
};

/// @dev Expect failure from assert, but returns error instead
module.exports.expectFailedAssert = async (promise) => {
  try {
    await promise;
  } catch (error) {
    assert(
      error.message.search('invalid opcode') > -1,
      'The contract should fail an assert. Instead: ' + error.message
    );

    return;
  }

  assert(false, "Did not fail assert as expected.");
};

/// @dev Get account balance
module.exports.getBalance = function (address) {
  return new Promise(function (resolve, reject) {
    web3.eth.getBalance(address, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    })
  })
}

/// @dev Get gas price
module.exports.getGasPrice = function () {
  return new Promise(function (resolve, reject) {
    web3.eth.getGasPrice(function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    })
  })
}


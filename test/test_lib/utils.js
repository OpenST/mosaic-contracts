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

const web3 = require('./web3.js');
const hashLock = require("./hash_lock");
const BN = require('bn.js');
const Assert = require('assert');

const NullAddress = "0x0000000000000000000000000000000000000000";

const ResultType = {
  FAIL: 0,
  SUCCESS: 1
};
Object.freeze(ResultType);


/**
 * Asserts that an error message contains a string given as message. Always
 * passes if the message is `undefined`.
 *
 * @param {string} message The message that the error should contain.
 * @param {Object} error The error.
 */
function assertExpectedMessage(message, error) {
  if (message !== undefined) {
    assert(
      error.message.search(message) > -1,
      'The contract was expected to error including "' + message + '", but instead: "' + error.message + '"'
    );
  }
};

/*
 *  Tracking Gas Usage
 */
const receipts = [];

function Utils() {

}

Utils.prototype = {

  logResponse: (response, description) => {
    receipts.push({
      receipt: response.receipt,
      description: description,
      response: response
    });
  },

  logReceipt: (receipt, description) => {
    receipts.push({
      receipt: receipt,
      description: description,
      response: null
    })
  },

  logTransaction: async (hash, description) => {
    const receipt = await web3.eth.getTransactionReceipt(hash)
    await this.logReceipt(receipt, description)
  },

  printGasStatistics: () => {
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
  },

  clearReceipts: () => {
    receipts.splice(0, receipts.length);
  },

  /*
   *  General event checks
   */
  expectNoEvents: (result) => {
    Assert.equal(result.receipt.logs.length, 0, "expected empty array of logs")
  },

  /*
   *  Basic Ethereum checks
   */
  /// @dev Compare to null address
  isNullAddress: (address) => {
    Assert.strictEqual(typeof address, 'string', `address must be of type 'string'`);
    return (address == NullAddress);
  },

  /// @dev Expect failure from invalid opcode or out of gas,
  ///      but returns error instead
  expectThrow: async (promise, expectedMessage) => {
    try {
      await promise;
    } catch (error) {
      if (expectedMessage !== undefined) {
        assertExpectedMessage(expectedMessage, error);
      } else {
        const invalidOpcode = error.message.search('invalid opcode') > -1;
        const outOfGas = error.message.search('out of gas') > -1;
        // Latest TestRPC has trouble with require
        const revertInstead = error.message.search('revert') > -1;
        const invalidAddress = error.message.search('invalid address') > -1;

        assert(invalidOpcode || outOfGas || revertInstead || invalidAddress, `Expected throw, but got ${error} instead`);
      }

      return;
    }
    assert(false, "Did not throw as expected");
  },

  /**
   * Asserts that a given ethereum call/transaction leads to a revert. The
   * call/transaction is given as a promise.
   *
   * @param {promise} promise Awaiting this promise must lead to a revert.
   * @param {string} expectedMessage If given, the returned error message must
   *                                 include this string (optional).
   */
  expectRevert: async (promise, expectedMessage) => {
    try {
      await promise;
    } catch (error) {
      assert(
        error.message.search('revert') > -1,
        'The contract should revert. Instead: ' + error.message
      );

      assertExpectedMessage(expectedMessage, error);
      return;
    }

    assert(false, "Did not revert as expected.");
  },

  /// @dev Expect failure from assert, but returns error instead
  expectFailedAssert: async (promise) => {
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
  },

  /// @dev Get account balance
  getBalance: (address) => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
    })
  },

  /// @dev Get gas price
  getGasPrice: () => {
    return new Promise((resolve, reject) => {
      web3.eth.getGasPrice((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
    })
  },

  validateEvents: (eventLogs, expectedData) => {
    assert.equal(
      eventLogs.length,
      Object.keys(expectedData).length,
      "Number of events emitted must match expected event counts"
    );
    eventLogs.forEach((event) => {
      let eventName = event.event;
      let eventData = Object.keys(event.args);
      let eventExpectedData = expectedData[eventName];

      assert.notEqual(eventExpectedData, undefined, "Expected event not found");

      for (let index in eventData) {

        let key = eventData[index];
        if (eventExpectedData[key]) {
          if (web3.utils.isBN(eventExpectedData[key])) {
            assert(
              event.args[key].eq(eventExpectedData[key]),
              `Event data ${key} must match the expectedData`
            );
          } else {
            assert.strictEqual(
              event.args[key],
              (eventExpectedData[key]),
              `Event data ${key} must match the expectedData`
            );
          }
        }
      }
    });
  },

  //Get latest hash
  generateHashLock: () => {
    return hashLock.getHashLock();
  },
  signHash: async (
    typeHash,
    intentHash,
    nonce,
    gasPrice,
    gasLimit,
    signerAddress) => {

    let digest = web3.utils.soliditySha3(
      { t: 'bytes32', v: typeHash },
      { t: 'bytes32', v: intentHash },
      { t: 'uint256', v: nonce },
      { t: 'uint256', v: gasPrice },
      { t: 'uint256', v: gasLimit }
    );
    let signature = await web3.eth.sign(digest, signerAddress);
    return {
      signature: signature,
      digest: digest
    };
  },
  ResultType: ResultType
};

module.exports = new Utils();





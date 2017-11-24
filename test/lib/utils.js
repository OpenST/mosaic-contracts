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
// test/lib/utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
// const BigNumber = require('bignumber.js');
const SolidityEvent = require("web3/lib/web3/event.js");

var SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol")
// var SimpleStake = artifacts.require("./SimpleStake.sol");

const NullAddress = "0x0000000000000000000000000000000000000000";

/// @dev Deploy SimpleToken and other contracts
///      to test full protocol
module.exports.deployContracts = async (artifacts, accounts) => {

	const token = await SimpleToken.new({ from: accounts[0], gas: 3500000 });

  // to be extended

	return {
		token : token
	}
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

        assert(invalidOpcode || outOfGas, `Expected throw, but got ${error} instead`);

        return;
    }

    assert(false, "Did not throw as expected");
};

/// @dev Get account balance
module.exports.getBalance = function (address) {
  return new Promise (function (resolve, reject) {
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
  return new Promise (function (resolve, reject) {
    web3.eth.getGasPrice(function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    })
  })
}

/// @dev Decode logs with ABI
module.exports.decodeLogs = (abi, logs) => {
    return decodeLogs(abi, logs)
}


function decodeLogs(abi, logs) {
   var decodedLogs = null
   try {
      decodedLogs = decodeLogsInternal(abi, logs)
   } catch(error) {
      throw new 'Could not decode receipt log for transaction ' + txID + ', message: ' + error
   }

   return decodedLogs
}


function decodeLogsInternal(abi, logs) {

   // Find events in the ABI
   var abiEvents = abi.filter(json => {
      return json.type === 'event'
   })

   if (abiEvents.length === 0) {
      return
   }

   // Build SolidityEvent objects
   var solidityEvents = []
   for (i = 0; i < abiEvents.length; i++) {
      solidityEvents.push(new SolidityEvent(null, abiEvents[i], null))
   }

   // Decode each log entry
   var decodedLogs = []
   for (i = 0; i < logs.length; i++) {

      var event = null
      for (j = 0; j < solidityEvents.length; j++) {
         if (solidityEvents[j].signature() == logs[i].topics[0].replace("0x", "")) {
            event = solidityEvents[j]
            break
         }
      }

      var decodedLog = null

      if (event != null) {
         decodedLog = event.decode(logs[i])
      } else {
         // We could not find the right event to decode this log entry, just keep as is.
         decodedLog = logs[i]
      }

      // Convert bytes32 parameters to ascii
      for (j = 0; j < abiEvents.length; j++) {
         const abiEvent = abiEvents[j]

         if (!abiEvent.inputs) {
            continue
         }

         if (abiEvent.name != decodedLog.name) {
            continue
         }

         for (k = 0; k < abiEvent.inputs; k++) {
            if (abiEvent.inputs[k].type == 'bytes32') {
               decodedLog.args[abiEvent.inputs[k].name] = hexToAscii(decodedLog.args[abiEvent.inputs[k]]);
            }
         }
      }

      decodedLogs.push(decodedLog)
   }

   return decodedLogs
}


function hexToAscii(hexStr) {
    var asciiStr = ''

    var start = (hex.substring(0, 2) === '0x') ? 2 : 0

    for (i = start; i < hexStr.length; i += 2) {
        var charCode = parseInt(hex.substr(i, 2), 16)

        if (code === 0) {
           continue
        }

        asciiStr += String.fromCharCode(code);
    }

    return asciiStr;
}
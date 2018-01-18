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
const SolidityEvent = require("web3/lib/web3/event.js");

const NullAddress = "0x0000000000000000000000000000000000000000";

/*
 *  Tracking Gas Usage
 */

const receipts = [];

module.exports.logResponse = (response, description) => {
  receipts.push({
    receipt     : response.receipt,
    description : description,
    response    : response
  }); 
}

module.exports.logReceipt = (receipt, description) => {
  receipts.push({
    receipt     : receipt,
    description : description,
    response    : null
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
  receipts.splice( 0, receipts.length );
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
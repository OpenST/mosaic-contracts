// Copyright 2019 OpenST Ltd.
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
// Test: lib/hash_lock.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

class Web3EventsDecoder {
  static getFormattedEvents(eventsData) {
    const formattedEvents = {};

    for (let i = 0; i < eventsData.length; i += 1) {
      const currEvent = eventsData[i];
      const currEventName = currEvent.name ? currEvent.name : currEvent.event;
      const currEventAddr = currEvent.address;
      const currEventParams = currEvent.events
        ? currEvent.events
        : currEvent.args;

      formattedEvents[currEventName] = { address: currEventAddr };

      if (Array.isArray(currEventParams)) {
        for (let j = 0; j < currEventParams.length; j += 1) {
          const p = currEventParams[j];
          formattedEvents[currEventName][p.name] = p.value;
        }
      } else {
        formattedEvents[currEventName] = currEventParams;
      }
    }

    return formattedEvents;
  }

  /**
   * Gets a events from a transaction.
   *
   * @param {Object} transaction The transaction object returned from truffle
   *                             when calling a function on a contract.
   * @param {Object} contract A truffle contract object.
   *
   * @returns {Object} The events, if any.
   */
  static getEvents(transaction, contract) {
    return Web3EventsDecoder.perform(transaction.receipt, contract.address, contract.abi);
  }

  // decode logs from a transaction receipt
  static perform(txReceipt, contractAddr, contractAbi) {
    let decodedEvents = [];

    // Transaction receipt not found
    if (!txReceipt) {
      console.error(' Transaction receipt was not found.');
      return;
    }

    // Block not yet mined
    if (!txReceipt.blockNumber) {
      console.error(
        ' Transaction not yet mined. Please try after some time. ',
      );
      return;
    }

    let logs = [];

    // Backwards compatibility:
    if (txReceipt.logs.length > 0) {
      logs = txReceipt.logs;
    } else if (txReceipt.rawLogs.length > 0) {
      logs = txReceipt.rawLogs;
    }

    if (logs.length > 0) {
      const abiDecoder = require('abi-decoder');

      const relevantLogs = [];

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const currContractAddrFromReceipt = log.address;

        if (!currContractAddrFromReceipt) {
          // No contract found for contract address.
          continue;
        }

        if (currContractAddrFromReceipt != contractAddr) {
          // Skipping event of contract that is not under inspection.
          continue;
        }

        if (log.topics === undefined || log.topics.length === 0) {
          // Logs that have an event already don't need to be encoded.
          if (log.event !== undefined) {
            decodedEvents.push(log);
          }
          continue;
        }

        if (!contractAbi) {
          // ABI not found for contract.
          return;
        }

        relevantLogs.push(log);
        abiDecoder.addABI(contractAbi);
      }

      if (relevantLogs.length > 0) {
        decodedEvents = decodedEvents.concat(
          abiDecoder.decodeLogs(relevantLogs),
        );
      }
    }

    return Web3EventsDecoder.getFormattedEvents(decodedEvents);
  }
}

module.exports = Web3EventsDecoder;

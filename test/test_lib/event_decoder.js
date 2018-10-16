"use strict";

const web3EventsDecoder = function () { };

web3EventsDecoder.prototype = {

  getFormattedEvents: function (eventsData) {
    var formattedEvents = {};

    var eventDataValues = {};

    for (var i = 0; i < eventsData.length; i++) {
      var currEvent = eventsData[i]
        , currEventName = currEvent.name
        , currEventAddr = currEvent.address
        , currEventParams = currEvent.events;

      formattedEvents[currEventName] = { address: currEventAddr };

      for (var j = 0; j < currEventParams.length; j++) {
        var p = currEventParams[j];
        formattedEvents[currEventName][p.name] = p.value;
      }

    }

    return formattedEvents;
  },

  // decode logs from a transaction receipt
  perform: function (txReceipt, contractAddr, contractAbi) {
    //console.log(txReceipt);
    //console.log(contractAddr);
    //console.log(contractAbi);
    var decodedEvents = [];

    // Transaction receipt not found
    if (!txReceipt) {
      console.error(" Transaction receipt was not found.");
      return;
    }

    // Block not yet mined
    if (!txReceipt.blockNumber) {
      console.error(" Transaction not yet mined. Please try after some time. ");
      return;
    }

    const toAddr = txReceipt.to;

    // if the address is a known address
    if (txReceipt.logs.length > 0) {

      var abiDecoder = require('abi-decoder')
        , relevantLogs = [];

      for (var i = 0; i < txReceipt.logs.length; i++) {

        var currContractAddrFromReciept = txReceipt.logs[i].address;

        console.debug('**** contract address: ' + txReceipt.logs[i].address + ' at log index(' + i + ') in TxHash: ' + txReceipt.transactionHash + '');

        if (!currContractAddrFromReciept) {
          console.error('**** No contract found for contract address: ' + txReceipt.logs[i].address + ' at log index(' + i + ') in TxHash: ' + txReceipt.transactionHash + '');
          continue;
        }

        if (currContractAddrFromReciept != contractAddr) {
          console.debug('**** Skipping event of contract that is not under inspection: ' + txReceipt.logs[i].address + ' at log index(' + i + ') in TxHash: ' + txReceipt.transactionHash + '');
          continue;
        }

        // ABI not found
        if (!contractAbi) {
          console.error("ABI not found for contract: " + contractAddr);
          return;
        }

        relevantLogs.push(txReceipt.logs[i]);
        abiDecoder.addABI(contractAbi);
      }

      if (relevantLogs.length > 0) {
        decodedEvents = abiDecoder.decodeLogs(relevantLogs);
      }

    }

    return this.getFormattedEvents(decodedEvents);
  }
};

module.exports = new web3EventsDecoder();

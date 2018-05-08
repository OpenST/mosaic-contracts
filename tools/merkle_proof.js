"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
;

// Worker contract deployment transaction
//{"success":true,"data":{"transaction_uuid":"35b4cb6d-3697-4df6-806f-1de19f52f296","transaction_hash":"0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a","transaction_receipt":{"blockHash":"0xd1d2effa9d957d373c5968064d318f271de34f7b5fc7c87089598eadb84c7a65","blockNumber":49,"contractAddress":"0x6cdaD399459fb1480E37FD1372f1F5c96152ddcA","cumulativeGasUsed":569731,"from":"0xb43190ee505e335a71ab46bf6057a8e023a55c11","gasUsed":569731,"logs":[],"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","status":"0x1","to":null,"transactionHash":"0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a","transactionIndex":0}}}

const blockHash = "d1d2effa9d957d373c5968064d318f271de34f7b5fc7c87089598eadb84c7a65"
  , txHash = "0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a"
  , accountAddress = "cd0cea667d856e42083908e0ba5467c7cd5bb7c1"
  , chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata_bkp"
  , workerContractAddress = '0x6cdad399459fb1480e37fd1372f1f5c96152ddca'
;
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
const epObjectWithoutChainData = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"))
  , epObjectWithChainData = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"), blockHash, chainDataPath)
;

const merkleProof = {

  receiptProofWithChainData: function(){
    epObjectWithChainData.getReceiptProof(txHash).then(function(proof){
      console.log("\n===========Starting receiptProofWithChainData===========\n");
      console.log("\n===========receiptProofWithChainData===========\n", proof);
      console.log("\n===========Ending receiptProofWithChainData===========\n");
    });
  },

  logProofWithChainData: function(){
    epObjectWithChainData.getLogProof(txHash, 0).then(function(proof){
      console.log("\n===========Starting logProofWithChainData===========\n");
      console.log("\n===========logProofWithChainData===========\n", proof);
      console.log("\n===========Ending logProofWithChainData===========\n");
    });
  },

  transactionProofWithChainData: function(){
    epObjectWithChainData.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========Starting transactionProofWithChainData===========\n");
      console.log("\n===========transactionProofWithChainData===========\n", proof);
      console.log("\n===========Ending transactionProofWithChainData===========\n");
    });
  },

  accountProofWithChainData: function(){
    console.log("\nStarting accountProofWithChainData");
    epObjectWithChainData.getAccountProof(accountAddress).then(async function(proof){
      console.log("\n===========Starting accountProofWithChainData===========\n");
      console.log("\n===========accountProofWithChainData===========\n", proof);
      console.log("\n===========Ending accountProofWithChainData===========\n");
      console.log("\n===========Starting verifyAccountProofWithChainData===========\n");
      var verifyResult = await EP.account(proof.address, proof.value, proof.parentNodes, proof.header, proof.blockHash);
      console.log("verifyAccountProof Result:", verifyResult);
      console.log("\n===========Ending verifyAccountProofWithChainData===========\n");
    });
  },

  storageProofWithChainData: function(){
    epObjectWithChainData.getStorageProof(workerContractAddress, 0x0).then(function(proof){
      console.log("\n===========Starting storageProofWithChainData===========\n");
      console.log("\n===========storageProofWithChainData===========\n", proof);
      console.log("\n===========Ending storageProofWithChainData===========\n");
    });
  },


  perform: function(){
    const oThis = this
    ;
    oThis.transactionProofWithChainData();
    oThis.receiptProofWithChainData();
    oThis.logProofWithChainData();
    oThis.transactionProofWithChainData();
    oThis.accountProofWithChainData();
    //oThis.storageProofWithChainData();
  }


};

merkleProof.perform();
"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
;

//{"blockHash":"0x78d35a81dde504577354cb9df2219f9ce4c22b4a7d5c64e569f5cb384b6895d5","blockNumber":29,"contractAddress":null,"cumulativeGasUsed":45822,"from":"0xac06b72b8c96ae8ff3fde11cdc7fb3c2962ab59b","gasUsed":45822,"logs":[{"address":"0xfa21286Da7Af525a75dc5dC88369f934dA7121c6","topics":["0xac46a4511b8366ae3b7cf3cf342e31556274975598dcae03c866f8f0f55d51c4","0x000000000000000000000000a857a17101fd72258a5d48077fc778cae3cf9b8f"],"data":"0x","blockNumber":29,"transactionHash":"0x50d845c7dd27d44598e94b9bdcdf091ffe393edc1d8bd28c6ee8cd50aa1d1c49","transactionIndex":0,"blockHash":"0x78d35a81dde504577354cb9df2219f9ce4c22b4a7d5c64e569f5cb384b6895d5","logIndex":0,"removed":false,"id":"log_fc1c66e7"}],"logsBloom":"0x00004000000000000000000000000000000000000000001000000000000000100000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000080000000000000040000000000000000000000020000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000","status":"0x1","to":"0xfa21286da7af525a75dc5dc88369f934da7121c6","transactionHash":"0x50d845c7dd27d44598e94b9bdcdf091ffe393edc1d8bd28c6ee8cd50aa1d1c49","transactionIndex":0}

// Address: {ac06b72b8c96ae8ff3fde11cdc7fb3c2962ab59b}
// Address: {a857a17101fd72258a5d48077fc778cae3cf9b8f}
// Address: {3d55aa90b9583b8af2c06cf681b32b1ab5ff319b}
// Address: {a48abab038655901223b0359fcca5622b7073c74}
// Address: {fe908ed80ce5acd2ee804689fbf90c4f8a8c482e}
// Address: {2f868cf328dacba8ce02041bc09c104c55c2e303}
// Address: {33527c5ab63945fb5c45b663351c5b756a5a8547}
// Address: {fca1cadf2221e4177f9ee2d55a8c53a9a50008ea}
// Address: {e514301e9e571a560ea9af8767040ec4ea93978d}

const blockHash = "0x78d35a81dde504577354cb9df2219f9ce4c22b4a7d5c64e569f5cb384b6895d5"
  , txHash = "0x50d845c7dd27d44598e94b9bdcdf091ffe393edc1d8bd28c6ee8cd50aa1d1c49"
  , accountAddress = "0xac06b72b8c96ae8ff3fde11cdc7fb3c2962ab59b"
  , chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata"
;
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
const epObjectWithoutChainData = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"))
  , epObjectWithChainData = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"), blockHash, chainDataPath)
;

const merkleProof = {

  transactionProofWithoutChainData: function(){
    console.log("\n===========Starting transactionProofWithoutChainData===========\n");
    epObjectWithoutChainData.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========transactionProofWithoutChainData===========\n", proof);
    });
    console.log("\n===========Ending transactionProofWithoutChainData===========\n");
  },

  receiptProofWithoutChainData: function(){
    console.log("\n===========Starting receiptProofWithoutChainData===========\n");
    epObjectWithoutChainData.getReceiptProof(txHash).then(function(proof){
      console.log("\n===========receiptProofWithoutChainData===========\n", proof);
    });
    console.log("\n===========Ending receiptProofWithoutChainData===========\n");
  },

  logProofWithoutChainData: function(){
    console.log("\n===========Starting logProofWithoutChainData===========\n");
    epObjectWithoutChainData.getLogProof(txHash, 0).then(function(proof){
      console.log("\n===========logProofWithoutChainData===========\n", proof);
    });
    console.log("\n===========Ending logProofWithoutChainData===========\n");
  },

  accountProofWithoutChainData: function(){
    console.log("\n===========Starting accountProofWithoutChainData===========\n");
    epObjectWithChainData.getAccountProof(accountAddress).then(function(proof){
      console.log("\n===========accountProofWithChainData===========\n", proof);
    });
    console.log("\n===========Ending accountProofWithoutChainData===========\n");
  },

  transactionProofWithChainData: function(){
    console.log("\n===========Starting transactionProofWithChainData===========\n");
    epObjectWithChainData.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========transactionProofWithChainData===========\n", proof);
    });
    console.log("\n===========Ending transactionProofWithChainData===========\n");
  },

  accountProofWithChainData: function(){
    console.log("\n===========Starting accountProofWithChainData===========\n");
    epObjectWithChainData.getAccountProof(accountAddress).then(function(proof){
      console.log("\n===========accountProofWithChainData===========\n", proof);
    });
    console.log("\n===========Ending accountProofWithChainData===========\n");
  },

  storageProofWithChainData: function(){
    console.log("\n===========Starting storageProofWithChainData===========\n");
    epObjectWithChainData.getStorageProof(accountAddress).then(function(proof){
      console.log("\n===========accountProofWithChainData===========\n", proof);
    });
    console.log("\n===========Ending storageProofWithChainData===========\n");
  },


  perform: function(){
    const oThis = this
    ;
    oThis.transactionProofWithoutChainData();
    oThis.receiptProofWithoutChainData();
    oThis.logProofWithoutChainData();
    //oThis.accountProofWithoutChainData();
    //oThis.transactionProofWithChainData();
    //oThis.accountProofWithChainData();
    // oThis.storageProofWithChainData()
    //oThis.storageProofWithChainData();
  }


};

merkleProof.perform();
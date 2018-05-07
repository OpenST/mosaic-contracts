"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
;

//{"blockHash":"0x8ba7b2d73a019f0412fe669157a63790131dcd5df212a3806799ac6a3bdae917","blockNumber":1309,"contractAddress":null,"cumulativeGasUsed":21272,"from":"0x6dcdc310fa4bba87cb1a87fe4d5e8040881686a7","gasUsed":21272,"logs":[],"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","status":"0x1","to":"0xc5ed9ae6c14d1d723d8a7c0ac7ece25ede43c40f","transactionHash":"0xf3368dc76331b4b6274a2719c279d5d6aff2df001ea9ed6cfdff01b05498f53f","transactionIndex":0}

// Address: {6506f9530109d2627c02ee740d5bc87fdf2d1bef}
// Address: {6dcdc310fa4bba87cb1a87fe4d5e8040881686a7}
// Address: {27b306f8f2d2c83938dbf5d978c95b865d8fdd09}
// Address: {24425ebbd40d501e82633ce43c15b892c30e95c0}
// Address: {4bcd3a413182ed47898e322c750c8275bc1d38af}
// Address: {7ae726bd191b840b033175e2af45c90edfb92897}
// Address: {35c9f417655c731095b2d08949dd31d11fc8356d}
// Address: {8359f15aa64fc468b70bd8fed46220f0f81112b1}
// Address: {8637647fc658d528998e40ee363d76e0692edf5d}

//{"success":true,"data":{"transaction_uuid":"bb9a98fb-c949-47ef-82df-ce9fbf2e088a","transaction_hash":"0x1ab7b8c6274e3435873198ffa0406468bf182af49010eae3e2f0d57fdee88c31","transaction_receipt":{"blockHash":"0xd444e116d31de1a932027fe4715475d0e622cd190290a1f686230addc47da3c4","blockNumber":49,"contractAddress":"0xf637cEc95e48C998D4C72844437e46f4f3197570","cumulativeGasUsed":569731,"from":"0xaca724fb7b7b0ba38aec2f254bd030769004ea2b","gasUsed":569731,"logs":[],"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","status":"0x1","to":null,"transactionHash":"0x1ab7b8c6274e3435873198ffa0406468bf182af49010eae3e2f0d57fdee88c31","transactionIndex":0}}}

const blockHash = "d444e116d31de1a932027fe4715475d0e622cd190290a1f686230addc47da3c4"
  , txHash = "0xf3368dc76331b4b6274a2719c279d5d6aff2df001ea9ed6cfdff01b05498f53f"
  , accountAddress = "0x6dcdc310fa4bba87cb1a87fe4d5e8040881686a7"
  , chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata1"
  , workerContractAddress = '0xf637cEc95e48C998D4C72844437e46f4f3197570'
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
    epObjectWithChainData.getStorageProof(workerContractAddress, 0x0).then(function(proof){
      console.log("\n===========storageProofWithChainData===========\n", proof);
    });
    console.log("\n===========Ending storageProofWithChainData===========\n");
  },


  perform: function(){
    const oThis = this
    ;
    // oThis.transactionProofWithoutChainData();
    // oThis.receiptProofWithoutChainData();
    // oThis.logProofWithoutChainData();
    //oThis.accountProofWithoutChainData();
    //oThis.transactionProofWithChainData();
    //oThis.accountProofWithChainData();
    oThis.storageProofWithChainData()
    //oThis.storageProofWithChainData();
  }


};

merkleProof.perform();
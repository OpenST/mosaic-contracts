"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
;

// { blockHash: '0x93fcd3a51148a93fe107ad352ba22c3b39e136113bba477b661dc2f594ca85de',
//   blockNumber: 658,
//   contractAddress: null,
//   cumulativeGasUsed: 63816,
//   from: '0xb11712b63b71f7667d4e2559368bcc1f52933818',
//   gasUsed: 21272,
//   logs: [],
//   logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   status: true,
//   to: '0x7a2ce8054c1800c8693191642759e11db3d770ff',
//   transactionHash: '0x297e8948150a9bd4f79bf8ce9988af87bd637f88f2fa2546e54ec775028bec1e',
//   transactionIndex: 2 }

// Address: {9d17f6b52f223e21c2aa8a6375bf6fb03d51cb64}
// Address: {b11712b63b71f7667d4e2559368bcc1f52933818}
// Address: {4a6a3fe95d7390db9b6d22836fdbdd2ccd73e3b2}
// Address: {c244a668def60dd4c2affe6a17e9d955ab32165d}
// Address: {993ba010aed08ef3343b793f40beb728257a9c2b}
// Address: {8d8e713280f11a9f09c12a2433306666771cd139}
// Address: {db68c2641821de7096cc48620d5e43f00a5e53f1}
// Address: {64ba526b7d33f551bc829a995d1b93f41bb08691}
// Address: {66cf46a96d6bf4bfc5a59214be66c20d948567f2}

const blockHash = "0x93fcd3a51148a93fe107ad352ba22c3b39e136113bba477b661dc2f594ca85de"
  , txHash = "0x297e8948150a9bd4f79bf8ce9988af87bd637f88f2fa2546e54ec775028bec1e"
  , accountAddress = "9d17f6b52f223e21c2aa8a6375bf6fb03d51cb64"
  , chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata"
;

const merkleProof = {

  transactionProofWithoutChainData: function(){
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"));
    epObject.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========transactionProofWithoutChainData===========\n", proof);
    });
  },

  receiptProofWithoutChainData: function(){
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"));
    epObject.getReceiptProof(txHash).then(function(proof){
      console.log("\n===========receiptProofWithoutChainData===========\n", proof);
    });
  },

  logProofWithoutChainData: function(){
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"));
    epObject.getLogProof(txHash, 0).then(function(proof){
      console.log("\n===========logProofWithoutChainData===========\n", proof);
    });
  },

  transactionProofWithChainData: function(){
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"), blockHash, chainDataPath);
    epObject.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========transactionProofWithChainData===========\n", proof);
    });
  },

  accountProofWithChainData: function(){
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"), blockHash, chainDataPath);
    epObject.getAccountProof(accountAddress).then(function(proof){
      console.log("\n===========accountProofWithChainData===========\n", proof);
    });
  },

  storageProofWithChainData: function(){
    var epObject = new EP(new Web3.providers.HttpProvider("http://127.0.0.1:9546"), blockHash, chainDataPath);
    epObject.getStorageProof(accountAddress).then(function(proof){
      console.log("\n===========accountProofWithChainData===========\n", proof);
    });
  },


  perform: function(){
    const oThis = this
    ;
    oThis.transactionProofWithoutChainData();
    oThis.receiptProofWithoutChainData();
    oThis.logProofWithoutChainData();
    // oThis.transactionProofWithChainData();
    // oThis.accountProofWithChainData();
    // oThis.storageProofWithChainData()
    //oThis.accountProof();
    //oThis.storageProof();
  }


};

merkleProof.perform();
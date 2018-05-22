"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
  , sha3 = require('js-sha3').keccak_256
;

// Worker contract deployment transaction
//{"success":true,"data":{"transaction_uuid":"35b4cb6d-3697-4df6-806f-1de19f52f296","transaction_hash":"0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a","transaction_receipt":{"blockHash":"0xd1d2effa9d957d373c5968064d318f271de34f7b5fc7c87089598eadb84c7a65","blockNumber":49,"contractAddress":"0x6cdaD399459fb1480E37FD1372f1F5c96152ddcA","cumulativeGasUsed":569731,"from":"0xb43190ee505e335a71ab46bf6057a8e023a55c11","gasUsed":569731,"logs":[],"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","status":"0x1","to":null,"transactionHash":"0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a","transactionIndex":0}}}

// Account Proof Data
const blockHash = "1ea237eff72a3dab869fdcb22ee79cf55fb5de017c77016594afba1c133bb3bd"
  , chainDataPath = "/Users/Pepo/Documents/projects/production_chain/uc_node_1409_22_may_1pm/geth/chaindata"
  , web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545")
  , epObjectWithoutChainData = new EP(web3Provider)
  , epObjectWithChainData = new EP(web3Provider, blockHash, chainDataPath)
;

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

const merkleProof = {

  receiptProofWithChainData: function(){
    const txHash = "0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a"
    ;
    epObjectWithChainData.getReceiptProof(txHash).then(function(proof){
      console.log("\n===========Starting receiptProofWithChainData===========\n");
      console.log("\n===========receiptProofWithChainData===========\n", proof);
      console.log("\n===========Ending receiptProofWithChainData===========\n");
    });
  },

  logProofWithChainData: function(){
    const txHash = "0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a"
    ;
    epObjectWithChainData.getLogProof(txHash, 0).then(function(proof){
      console.log("\n===========Starting logProofWithChainData===========\n");
      console.log("\n===========logProofWithChainData===========\n", proof);
      console.log("\n===========Ending logProofWithChainData===========\n");
    });
  },

  transactionProofWithChainData: function(){
    const txHash = "0x7606ed6ac38254f15b485119ea44153f962af69b211bbaf00ca88e973753323a"
    ;
    epObjectWithChainData.getTransactionProof(txHash).then(function(proof){
      console.log("\n===========Starting transactionProofWithChainData===========\n");
      console.log("\n===========transactionProofWithChainData===========\n", proof);
      console.log("\n===========Ending transactionProofWithChainData===========\n");
    });
  },

  accountProofWithChainData: function(){
    const accountAddress = "01dB94fdCa0FFeDc40A6965DE97790085d71b412"
    ;

    console.log("\nStarting accountProofWithChainData");
    epObjectWithChainData.getAccountProof(accountAddress).then(async function(proof){
      console.log("\n===========Starting accountProofWithChainData===========\n");
      console.log("\n===========accountProofWithChainData===========\n", JSON.stringify(proof));
      console.log("\n===========Ending accountProofWithChainData===========\n");
      console.log("\n===========Starting verifyAccountProofWithChainData===========\n");
      var verifyResult = await EP.account(proof.address, proof.value, proof.parentNodes, proof.header, proof.blockHash);
      console.log("verifyAccountProof Result:", verifyResult);
      console.log("\n===========Ending verifyAccountProofWithChainData===========\n");
    });
  },

  // Storage Proof Data
  // { blockHash: '0xaf85800048e1aed4efd9665b5ae37329ee2eb72095cc8a8cfbd2c881f0e24210',
  //   blockNumber: 4229,
  //   contractAddress: '0xDD0339B562F83209e2DB7812abAAD399d5059c67',
  //   cumulativeGasUsed: 153738,
  //   from: '0xb43190ee505e335a71ab46bf6057a8e023a55c11',
  //   gasUsed: 153738,
  //   logs: [],
  //   logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  //   status: '0x1',
  //   to: null,
  //   transactionHash: '0x2f159e7ad8a1a06baadc00cfd4cb1fda398d86e8471c9a8c76d0e010a4df84bf',
  //   transactionIndex: 0 }
  storageProofWithChainDataForVariableValue: function(){
    var openstUtilityContractAddress = '01dB94fdCa0FFeDc40A6965DE97790085d71b412'
      , openstUtilityregisteredTokensIndexPosition = 0x03
      , stPrimeContractAddress = '784A7a02CBBA9aD42FE0477E0B323C54CdF78D5A'
    ;
    epObjectWithChainData.getStorageProof(openstUtilityContractAddress, openstUtilityregisteredTokensIndexPosition).then(async function(proof){
      console.log("\n===========Starting storageProofWithChainDataForVariableValue===========\n");
      console.log("\n===========storageProofWithChainData===========\n", proof);
      console.log("\n===========Ending storageProofWithChainDataForVariableValue===========\n");
      var verifyResult = await EP.storageAtIndex(
        proof.storageIndex,
        stPrimeContractAddress,//Buffer.from(stPrimeContractAddress,'hex'),
        proof.storageParentNodes,
        proof.address,
        proof.accountParentNodes,
        proof.header,
        proof.blockHash);
      console.log("storageProofWithChainDataForVariableValue verifyAccountProof Result:", verifyResult);
    });
  },

  // Storage Proof Data
  // { blockHash: '0xaf85800048e1aed4efd9665b5ae37329ee2eb72095cc8a8cfbd2c881f0e24210',
  //   blockNumber: 4229,
  //   contractAddress: '0xDD0339B562F83209e2DB7812abAAD399d5059c67',
  //   cumulativeGasUsed: 153738,
  //   from: '0xb43190ee505e335a71ab46bf6057a8e023a55c11',
  //   gasUsed: 153738,
  //   logs: [],
  //   logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  //   status: '0x1',
  //   to: null,
  //   transactionHash: '0x2f159e7ad8a1a06baadc00cfd4cb1fda398d86e8471c9a8c76d0e010a4df84bf',
  //   transactionIndex: 0 }
  // 1754
  storageProofWithChainDataForMappingKey: function(){
    var openstUtilityContractAddress = '01dB94fdCa0FFeDc40A6965DE97790085d71b412'
      , openstUtilityregisteredTokensIndexPosition = 0x00
      , tokenUUID = '2509198a8c357187595763a882728cadeb7300a0cd518d08cd93fb666a4de08c'
    ;
     epObjectWithChainData.getStorageProof(openstUtilityContractAddress, openstUtilityregisteredTokensIndexPosition, tokenUUID).then(async function(proof){
      console.log("\n===========storageProofWithChainDataForMappingKey===========\n", proof);
      var verifyResult = await EP.storageMapping(
        proof.storageIndex,
        proof.mappings,
        proof.value,
        proof.storageParentNodes,
        proof.address,
        proof.accountParentNodes,
        proof.header,
        proof.blockHash);
      console.log("verifyAccountProof Result:", verifyResult);
    });

  },


  perform: function(){
    const oThis = this
    ;
    // oThis.transactionProofWithChainData();
    // oThis.receiptProofWithChainData();
    // oThis.logProofWithChainData();
    // oThis.transactionProofWithChainData();
    // oThis.accountProofWithChainData();
    oThis.storageProofWithChainDataForVariableValue();
    //oThis.storageProofWithChainDataForMappingKey();
  }


};

merkleProof.perform();
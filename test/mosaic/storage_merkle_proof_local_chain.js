"use strict";

const rootPrefix = '../..'
  , Web3 = require('web3')
  , EP  = require('eth-proof')
;

// Account Proof Data
const blockHash = "31a9757fe982ddcc4cb2aec34aef7721709528b00200421e31fa7f04d62ea11e"
  , chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata_backup"
  , web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:9546")
  , epObjectWithChainData = new EP(web3Provider, blockHash, chainDataPath)
  , storageContractAddress = 'D6146a38563A31c3DA00966C07CA47f9ce7B5bf2'
;

// Variable Data
const variableIndexPosition = 0x00
  , value = 1234
;

// Mapping Data
const mappingIndexPosition = '01'
  , senderDeployerAddress = 'de29d0cba23b6ca26da33a8dec13bcfc5aae1619'
  , mappingValue = 5678
;

// Receipt
// deploy Receipt:  { blockHash: '0x31a9757fe982ddcc4cb2aec34aef7721709528b00200421e31fa7f04d62ea11e',
//   blockNumber: 765,
//   contractAddress: '0xD6146a38563A31c3DA00966C07CA47f9ce7B5bf2',
//   cumulativeGasUsed: 153738,
//   from: '0xde29d0cba23b6ca26da33a8dec13bcfc5aae1619',
//   gasUsed: 153738,
//   logs: [],
//   logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   status: '0x1',
//   to: null,
//   transactionHash: '0xa70f7c8ecdec24537536383a0cb52b4e196878ce1c87f522abb2f4144c4f890c',
//   transactionIndex: 0 }

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

const storageMerkleProofLocalChain = {

  storageProofWithChainDataForVariableValue: function(){

    epObjectWithChainData.getStorageProof(storageContractAddress, value).then(async function(proof){
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

  getStorageProof: function() {
    return new Promise(function(onResolve, onReject){
      epObjectWithChainData.getStorageProof(storageContractAddress, mappingIndexPosition, senderDeployerAddress).then(async function(proof){
        onResolve(proof);
      });
    });
  },

  storageProofWithChainDataForMappingKey: async function(){
    const oThis = this
      , proof = await oThis.getStorageProof()
    ;
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
  },


  perform: async function(){
    const oThis = this
    ;
    await oThis.storageProofWithChainDataForMappingKey();
  }


};

storageMerkleProofLocalChain.perform();

let Assert = require('assert');
let EP  = require('eth-proof');
let Web3 = require('web3');
const MerklePatriciaProof = artifacts.require("./mosaic/MerklePatriciaProof.sol");

const web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:9545");

/// @dev Deploy 
module.exports.deployMerklePatriciaProof = async (artifacts, accounts) => {

  const openSTProtocol = accounts[4];
  const merklePatriciaProof = await MerklePatriciaProof.new({from: openSTProtocol});
  return {
    merklePatriciaProof: merklePatriciaProof
  }
}

module.exports.accountProof = function (accountAddress, blockHash, chainDataPath) {

   const epObjectWithChainData = new EP(web3Provider, blockHash, chainDataPath);
  Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

  return epObjectWithChainData.getAccountProof(accountAddress).then(async function(proof){
      return proof;
  });
}

let EP  = require('eth-proof');
let Web3 = require('web3');
const MerklePatriciaProof = artifacts.require("./mosaic/MerklePatriciaProof.sol");
const VerifyProof = artifacts.require("./mosaic/VerifyProof.sol");

/// deploy Contract
module.exports.deployMerklePatriciaProof = async (artifacts, accounts) => {

  const openSTProtocol = accounts[4];
  const merklePatriciaProof = await MerklePatriciaProof.new({from: openSTProtocol});
  return {
    merklePatriciaProof: merklePatriciaProof
  }
};

/// deploy Contract
module.exports.deployVerifyProof = async (artifacts, accounts) => {

  const openSTProtocol = accounts[4];
  const verifyProof = await VerifyProof.new({from: openSTProtocol});
  return {
    verifyProof: verifyProof
  }
};


/*
     * @dev Generate Account Proof
     * @param accountAddress
     * @param block hash
     * @param chainDataPath Path to chainData folder of geth
     * @param root The root hash of the trie.
     * @return Proof = { blockHash, block Header, ParentNodes, address, Value of accountNode}
     */
module.exports.accountProof = function (accountAddress, blockHash, chainDataPath) {
  const web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:9545");
   const epObjectWithChainData = new EP(web3Provider, blockHash, chainDataPath);
  Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

  return epObjectWithChainData.getAccountProof(accountAddress).then(async function(proof){
      return proof;
  });
};


module.exports.getStorageMappingKeyProof = function (blockHash, chainDataPath, storageContractAddress, mappingIndexPosition, senderDeployerAddress) {
  const web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:9546");
  Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
  const epObjectWithChainData = new EP(web3Provider, blockHash, chainDataPath);
  return epObjectWithChainData.getStorageProof(storageContractAddress, mappingIndexPosition, senderDeployerAddress).then(async function (proof) {
    return proof;
  });
};

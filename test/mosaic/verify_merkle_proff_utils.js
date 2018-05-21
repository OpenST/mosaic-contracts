// Copyright 2017 OpenST Ltd.
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
// Test: BrandedToken_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

let Assert = require('assert');
let EP  = require('eth-proof');
let Web3 = require('web3')
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
    console.log("proof")
      return proof;
    //let verifyResult = await EP.account(proof.address, proof.value, proof.parentNodes, proof.header, proof.blockHash);
  });
}

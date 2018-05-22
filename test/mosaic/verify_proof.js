const util = require('ethereumjs-util');
const RLP = require('rlp');
const Web3 = require('web3');
const merkleProffUtils = require('./verify_merkle_proff_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
contract('merkel-Proff', function (accounts) {

  describe('Verify Merkel Proff', async () => {

    const accountAddress = "2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875";
    const blockHash = "356f594c5baf958cf61fc81950b7496d7c45e2ae9a9e5e8dec8a92bfb9c20ccf";//"6181b9a000af555c71600b17cbdd5223e12521d3fb1d12db3fdba330a4f2cb20";
    const chainDataPath = "/Users/sarveshjain/workspace/prodgeth/uc_node_backup_1409/geth/chaindata";
    const stateRoot = "40307aa1af26430c6c064f5b07898d4e005ecbc0c0f7899110e4f2c030e80668";//'47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';

    let contract;
    let proof;

    before(async () => {
      console.log("deploying contract");
      let mptContract = await merkleProffUtils.deployMerklePatriciaProof(artifacts, accounts);
      console.log("deploying contract done");
      contract = mptContract.merklePatriciaProof;
      console.log("generating proof");
      proof = await merkleProffUtils.accountProof(accountAddress, blockHash, chainDataPath);
      console.log("generating proof done");
    });

    function hash(dta) {
      let from = Buffer.from(dta);
      return util.sha3(from);
    }

    function getAHash(acc_dta) {
      acc_dta = RLP.encode(acc_dta);
      let ahash = hash(acc_dta);
      return "0x" + ahash.toString("hex")
    }

    function rlpParentsNodes(proof) {
      let proof_rlp = RLP.encode(proof);
      console.log(proof_rlp);
      return "0x" + proof_rlp.toString("hex");
    }


    it('verify account proof ', async () => {
      let addr = accounts[4];//accountAddress;
      let proofNodes = proof.parentNodes;
      let value = getAHash(proof.value); // aHash
      let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
      let root = stateRoot;
      //let encodeStateRootRoot = root.toString('utf8');
      console.log("proofNodes", proofNodes);
      //let actualResult = await contract.verify(value, encodedPath, rlpParentNodes, encodeStateRootRoot, {from: accounts[0]});
      console.log("******root is same as nodes****");
      //console.log(root);
      console.log(Buffer.from(util.sha3(Buffer.from(root, 'hex')), 'hex'));
      console.log(Buffer.from(root, 'hex'));
      console.log(util.sha3(proof.parentNodes[0]));
      let actualResult = await contract.verify(value, addr, rlpParentNodes, root, {from: accounts[0]});
      console.log("verify result:", JSON.stringify(actualResult));
      assert.equal(actualResult, true);
    });
  })

});
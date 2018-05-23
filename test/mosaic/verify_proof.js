const util = require('ethereumjs-util');
const RLP = require('rlp');
const Web3 = require('web3');
const merkleProffUtils = require('./verify_merkle_proff_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
contract('Merkel Patricia Proff', function (accounts) {

  describe('Verify Merkel Patricia Proof', async () => {

    const accountAddress = "2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875";
    const chainDataPath = "/Users/sarveshjain/workspace/prodgeth/uc_node_backup_1409/geth/chaindata";

    let blockHash;
    let stateRoot;
    let contract;
    let proof;

    before(async () => {
      const blockNumber = 3003900;//await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(blockNumber);
      blockHash = block.hash.slice(2);
      stateRoot = block.stateRoot;
      //deploy contract
      let mptContract = await merkleProffUtils.deployMerklePatriciaProof(artifacts, accounts);
      contract = mptContract.merklePatriciaProof;
      //generate account Proof
      proof = await merkleProffUtils.accountProof(accountAddress, blockHash, chainDataPath);
    });

    //sha3 of data
    function hash(dta) {
      let from = Buffer.from(dta);
      return util.sha3(from);
    }

    /*
      Sha3 and RLP encoding AccountData fields:
       -nonce
      – balance
      – storageRoot
      – codeHash
*/
    function getAHash(acc_dta) {
      acc_dta = RLP.encode(acc_dta);
      let ahash = hash(acc_dta);
      return "0x" + ahash.toString("hex");
    }

    // RLP Encoding proof
    function rlpParentsNodes(proof) {
      let proof_rlp = RLP.encode(proof);
      console.log(proof_rlp);
      return "0x" + proof_rlp.toString("hex");
    }

    it('verify account proof ', async () => {
      let addr = "0x" + accountAddress;
      let proofNodes = proof.parentNodes;
      let value = getAHash(proof.value); // aHash
      let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
      let actualResult = await contract.verify.call(value, addr, rlpParentNodes, stateRoot, {from: accounts[0]});
      assert.equal(actualResult, true);
    });
  })

});
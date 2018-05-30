const util = require('ethereumjs-util');
const RLP = require('rlp');
const Web3 = require('web3');
const merkleProffUtils = require('./verify_merkle_proof_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
contract('Merkel Patricia Proff', function (accounts) {

  describe('Verify Merkel Patricia Proof', async () => {

    const accountAddress = "01dB94fdCa0FFeDc40A6965DE97790085d71b412";
    const chainDataPath = "/Users/Pepo/Documents/projects/production_chain/uc_node_1409_29_map_7am/geth/chaindata";

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
      let verifyProof = await merkleProffUtils.deployVerifyProof(artifacts, accounts);
      contract = verifyProof.verifyProof;
      //generate account Proof
      proof = await merkleProffUtils.accountProof(accountAddress, blockHash, chainDataPath);
      console.log("proof:", proof);
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
      for (i = 0; i < proofNodes.length; i++) {
        //console.log("proofNodes[i]", i, proofNodes[i]);
        console.log("\nhash of i", i, "is: ", await util.sha3(RLP.encode(proofNodes[i])).toString('hex'));
      }
      let value = getAHash(proof.value); // aHash
      let rlpParentNodes = rlpParentsNodes(proofNodes); // parentNodes
      console.log("Verify Account Input Values");
      let hashedAddr = util.sha3(addr);
      console.log("\nvalue", value, "\naddr", addr, "\nhashed addr path", hashedAddr, "\nstringify path", hashedAddr.toString('hex'), "\nstateRoot", stateRoot);

      let selectedIndex = proofNodes[0][12].toString('hex');
      let node2Sha3 = util.sha3(RLP.encode(proofNodes[1]));
      let isHashSame = selectedIndex == node2Sha3;
      console.log("is hash same ", isHashSame);
      console.log("selected Index", selectedIndex);
      console.log("node2Sha3", node2Sha3);
      let actualResult = await contract.accountInState.call(value, addr, rlpParentNodes, stateRoot, {from: accounts[0]});
      assert.equal(actualResult, true);
      // result = await contract.accountInState(value, addr, rlpParentNodes, stateRoot, {from: accounts[0]});
      // console.log(result.receipt.logs);
    });
  })

});
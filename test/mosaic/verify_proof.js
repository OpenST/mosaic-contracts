const util = require('ethereumjs-util');
const RLP = require('rlp');
const Web3 = require('web3');
const merkleProffUtils = require('./verify_merkle_proff_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
contract('merkel-Proff', function (accounts) {

  describe('Verify Merkel Proff', async () => {

    const accountAddress = "2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875";
    const blockHash = "6181b9a000af555c71600b17cbdd5223e12521d3fb1d12db3fdba330a4f2cb20";
    const chainDataPath = "/Users/sarveshjain/workspace/prodgeth/uc_node_backup_1409/geth/chaindata";

    let contract;
    let proof;

    before(async () => {
      let mptContract = await merkleProffUtils.deployMerklePatriciaProof(artifacts, accounts);
      contract = mptContract.merklePatriciaProof;
      proof = await merkleProffUtils.accountProof(accountAddress, blockHash, chainDataPath);
    });

    function hash(dta) {
      let from = Buffer.from(dta);
      return util.sha3(from);
    }

    function getAHash(acc_dta) {
      console.log("acc_data ", acc_dta);
      let value1 = acc_dta[0].toString();
      let value2 = acc_dta[1];
      let value3 = acc_dta[2].toString();
      let value4 = acc_dta[3].toString();
      acc_dta = RLP.encode(acc_dta);
      let ahash = hash(acc_dta);
      return "0x" + ahash.toString("hex")
    }

    function rlpParentsNodes(proof) {
      //let proof_rlp = RLP.encode(proof);
      let proof_rlp = RLP.encode(proof.map(a => {
        console.log("a value ", a);
        return RLP.decode(a);
      }));
      console.log(proof_rlp);
      return "0x" + proof_rlp.toString("hex");
    }


    it('verify account proof ', async () => {
      let addr = accounts[4];//accountAddress;
      let proofNodes = proof.parentNodes;
      let blockNumber = await web3.eth.getBlockNumber();
      let value = getAHash(proof.value); // aHash
      //let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
      let block = await web3.eth.getBlock(blockNumber);
      let root = block.stateRoot;// '47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b'
      //let encodeStateRootRoot = root.toString('utf8');
      console.log("proofNodes", proofNodes);
      //let actualResult = await contract.verify(value, encodedPath, rlpParentNodes, encodeStateRootRoot, {from: accounts[0]});
      let actualResult = await contract.verify(value, addr, proofNodes, root, {from: accounts[0]});
      //console.log("verify result:", JSON.stringify(actualResult));
      //assert.equal(actualResult, true);

    })
  })

});
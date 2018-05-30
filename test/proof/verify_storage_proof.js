const util = require('ethereumjs-util');
const RLP = require('rlp');
let EP  = require('eth-proof');
const Web3 = require('web3');
const merkleProofUtils = require('./verify_merkle_proof_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
let epObjectWithChainData = null;

contract('Merkel Patricia Proof', function (accounts) {

  describe('Verify Merkel Patricia Proof', async () => {

    const chainDataPath = "/Users/Pepo/Documents/projects/openst-payments/mocha_test/scripts/st-poa/geth/chaindata_30may_2018_v1";
    const storageContractAddress = '701F638A493Eb614aD9708c294414Ff5Bb3bdB5F';
    const mappingIndexPosition = '01';
    const stakingIntentHashObject = {
      "14bb2bf372bbfc1de82d7a80510e8bf9c0735e1982c822f370f0882fc1d4f607": '5678',
      "a20cef82a08a0952b1989262b53492c68a64dc230a885aff8c38dc9bd067a8d0": '5680'
    };
    const blockHash = "2dd7178d5fe6ebd6f6ab280e8d120e5d7f6e7146b0e523491a4c15ce3986add9";
    let contract;
    let proof;

    before(async () => {
      let verifyProof = await merkleProofUtils.deployVerifyProof(artifacts, accounts);
      contract = verifyProof.verifyProof;

      epObjectWithChainData = await merkleProofUtils.getEthProofObject(blockHash, chainDataPath);
    });

    function hash(dta) {
      let from = Buffer.from(dta);
      return util.sha3(from);
    }

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

    function leftPad(str) {
      return ("0000000000000000000000000000000000000000000000000000000000000000" + str).substring(str.length)
    }

    function getPath(storageIndex, mappings) {

      let pathBuilder = Buffer.from(leftPad(storageIndex.toString('hex')), 'hex');
      for (let i = 0; i < mappings.length; i++) {
        pathBuilder = Buffer.concat([Buffer.from(leftPad(mappings[i].toString('hex')), 'hex'), pathBuilder])
      }
      pathBuilder = Buffer.from(util.sha3(pathBuilder), 'hex')
      let storagePath = Buffer.from(util.sha3(pathBuilder), 'hex');
      return util.bufferToHex(storagePath);
    }

    it('verify storage account proof ', async () => {

      for(let stakingIntentHash in stakingIntentHashObject) {
        console.log("stakingIntentHash:", stakingIntentHash);
        let value = stakingIntentHashObject[stakingIntentHash];
        //let proofBufferValue = Buffer.concat([Buffer.from(value, "hex"), new Buffer(32-value.length)]);
        proof = await merkleProofUtils.getStorageMappingKeyProof(epObjectWithChainData, storageContractAddress,
          mappingIndexPosition, stakingIntentHash);
        let addr = getPath(proof.storageIndex, proof.mappings)//"0x" + storageContractAddress;
        let proofNodes = proof.storageParentNodes;
        let proofBufferValue = proof.value;
        let hashedValue = getAHash(proofBufferValue); // aHash
        console.log("\nproofBufferValue value:", proofBufferValue, "\nstring value:", proofBufferValue.toString());
        console.log("\nproof.value value:", proof.value, "\nproof.value string value:", proof.value.toString());
        let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
        let storageRoot = util.bufferToHex(proof.account);

        let actualResult = await contract.storageInAccount.call(hashedValue, addr, rlpParentNodes, storageRoot, {from: accounts[0]});
        assert.equal(actualResult, true);
      }

    });
  })

});
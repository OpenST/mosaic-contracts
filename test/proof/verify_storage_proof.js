const util = require('ethereumjs-util');
const RLP = require('rlp');
let EP  = require('eth-proof');
const Web3 = require('web3');
const merkleProofUtils = require('./verify_merkle_proof_utils.js');
const web3 = new Web3("http://127.0.0.1:9546");
let epObjectWithChainData = null;


contract('Merkel Patricia Proof', function (accounts) {

  describe('Verify Merkel Patricia Proof', async () => {

    const chainDataPath = "/Users/sarveshjain/workspace/openst-payments/mocha_test/scripts/st-poa-backup/geth/chaindata";
    const storageContractAddress = '17547293608ed3D723bE3C739fFb3bAB3f613570';
    const mappingIndexPosition = '01';
    const stakingIntentHashObject = {
      "14bb2bf372bbfc1de82d7a80510e8bf9c0735e1982c822f370f0882fc1d4f607": '5678',
      "a20cef82a08a0952b1989262b53492c68a64dc230a885aff8c38dc9bd067a8d0": '5680803456'
    };
    const blockHash = "aef770b488454554bd1c1439f086407a413e94e295fac550710038268b5c789e";
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

    function getAHash(data) {
      data = RLP.encode(data);
      let ahash = hash(data);
      return "0x" + ahash.toString("hex");
    }

    // RLP Encoding proof
    function rlpParentsNodes(proof) {
      let proof_rlp = RLP.encode(proof);
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
      pathBuilder = Buffer.from(util.sha3(pathBuilder), 'hex');
      let storagePath = Buffer.from(util.sha3(pathBuilder), 'hex');
      return util.bufferToHex(storagePath);
    }

    function getFormatedLength(twiceLength) {
      return parseInt(twiceLength).toString(16).length % 2 === 0 ?
        parseInt(twiceLength).toString(16) :
        '0' + parseInt(twiceLength).toString(16);
    }

    function formatValue(value) {
      let twiceLength = (2 * value.length);
      let formatedLength = getFormatedLength(twiceLength);
      let lowerBytesFromLength = Buffer.from(formatedLength, 'hex');
      let valueBuffer = Buffer.from(value);
      let padding = new Buffer(32 - lowerBytesFromLength.toString().length - valueBuffer.toString().length);
      return Buffer.concat([valueBuffer, padding, lowerBytesFromLength]);
    }

    for (let stakingIntentHash in stakingIntentHashObject) {
      it('verify storage account proof for intent ' + stakingIntentHash, async () => {

        let value = stakingIntentHashObject[stakingIntentHash];
        proof = await merkleProofUtils.getStorageMappingKeyProof(epObjectWithChainData, storageContractAddress,
          mappingIndexPosition, stakingIntentHash);


        let addr = getPath(proof.storageIndex, proof.mappings)//"0x" + storageContractAddress;
        let proofNodes = proof.storageParentNodes;

        let proofBufferValue = formatValue(value);
        let hashedValue = getAHash(proofBufferValue); // aHash
        let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
        let storageRoot = util.bufferToHex(proof.account);

        let actualResult = await contract.storageInAccount.call(hashedValue, addr, rlpParentNodes, storageRoot, {from: accounts[0]});
        assert.equal(actualResult, true);


      });
    }
  })

});
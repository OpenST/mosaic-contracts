const util = require('ethereumjs-util');
const RLP = require('rlp');
const Web3 = require('web3');
const merkleProffUtils = require('./verify_merkle_proof_utils.js');
const web3 = new Web3("http://127.0.0.1:9545");
contract('Merkel Patricia Proff', function (accounts) {

  describe('Verify Merkel Patricia Proof', async () => {

    const chainDataPath = "/Users/sarveshjain/workspace/openst-payments/mocha_test/scripts/st-poa-backup/geth/chaindata";
    const storageContractAddress = '10a023D13D45425aA6C1fB30ccAa75103FfD592e';
    const mappingIndexPosition = '01';
    const senderDeployerAddress = 'e701297b81e281800e4c3c7718afe5c05d1c3d1d';
    const blockHash = "cbe1cb969bf317c4f718f78fb257d8386a46eed2d265c222eb22f59272ed7a64";
    let contract;
    let proof;
    let mappingValue = 5678;

    before(async () => {

      let verifyProof = await merkleProffUtils.deployVerifyProof(artifacts, accounts);
      contract = verifyProof.verifyProof;
      proof = await merkleProffUtils.getStorageMappingKeyProof(blockHash, chainDataPath, storageContractAddress,
        mappingIndexPosition, senderDeployerAddress);
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

      let pathBuilder = Buffer.from(leftPad(storageIndex.toString('hex')), 'hex')
      for (let i = 0; i < mappings.length; i++) {
        pathBuilder = Buffer.concat([Buffer.from(leftPad(mappings[i].toString('hex')), 'hex'), pathBuilder])
      }
      pathBuilder = Buffer.from(util.sha3(pathBuilder), 'hex')
      let storagePath = Buffer.from(util.sha3(pathBuilder), 'hex');
      return util.bufferToHex(storagePath);
    }

    it('verify storage account proof ', async () => {

      let addr = getPath(proof.storageIndex, proof.mappings)//"0x" + storageContractAddress;
      let proofNodes = proof.storageParentNodes;
      let value = getAHash(proof.value); // aHash
      let rlpParentNodes = rlpParentsNodes(proofNodes); //parentNodes
      let storageRoot = util.bufferToHex(proof.account);

      let actualResult = await contract.storageInAccount.call(value, addr, rlpParentNodes, storageRoot, {from: accounts[0]});
      assert.equal(actualResult, true);
    });
  })

});
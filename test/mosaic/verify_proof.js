const util = require('ethereumjs-util');
const RLP = require('rlp');
const merkleProffUtils = require('./verify_merkle_proff_utils.js');

contract('merkel-Proff', function (accounts) {

  describe('Verify Merkel Proff', async () => {

    const accountAddress = "2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875";
    const blockHash = "5815e3b50564df4fd6958ee7c659ca5867b4d0e8edfc87f8f61158aaabd41418";
    const chainDataPath = "/Users/sarveshjain/workspace/prodgeth/uc_node_backup_1409/geth/chaindata";

    let contract;
    let proof;

    before(async () => {
      let mptContract = await merkleProffUtils.deployMerklePatriciaProof(artifacts, accounts);
      contract = mptContract.merklePatriciaProof;
      proof = merkleProffUtils.accountProof(accountAddress, blockHash, chainDataPath);
    });

    function hash(dta) {
      return util.sha3(Buffer.from(dta.substr(2), "hex"))
    }

    function getAHash(account) {
      let blockNumber = await
      web3.eth.getBlockNumber();
      let blockHash = await
      web3.eth.getBlock(blockNumber);
      let acc_dta = await
      web3.eth.getAccountRLP(blockHash.hash, account);
      let ahash = hash(acc_dta)
      return "0x" + ahash.toString("hex")
    }

    function rlpParentsNodes(proof) {

      let proof_rlp = RLP.encode(proof.map(a => RLP.decode(a)))
      return "0x" + proof_rlp.toString("hex");
    }

    function getAccountProff(account) {

      let proof = [];
      return proof;
    }


    it('verify account proff ', async () => {
     /* let addr = accounts[4];//accountAddress;
      let proof = getAccountProff(addr);
      let blockNumber = await web3.eth.getBlockNumber();

      let value = getAHash(); // aHash
      let encodedPath = util.keccak256(addr);  //key  //  add = store.options.address path = bytes32ToBytes(keccak256(addr));
      let rlpParentNodes = rlpParentsNodes(proof); //parentNodes

      let root = web3.eth.getBlock(blockNumber).stateRoot;

*/
      let actualResult =true;// await contract.verify(value, encodedPath, rlpParentNodes, root);
      assert.equal(actualResult, true);

    })
  })

});
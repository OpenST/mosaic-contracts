const MerklePatriciaProofMock = artifacts.require("./MerklePatriciaProofMock.sol");
const accountInfo =  require("./data/AccountInfo.json");
var ethutil = require ("ethereumjs-util");


contract('MerklePatriciaProof', function(accounts) {


    var merkle= null;

    describe('Test Cases', async () => {
        before(async () => {
            merkleMock = await MerklePatriciaProofMock.new();
        })

        it('verify', async () => {
           //console.log(merkleMock);
          // console.log("AccountInfo",accountInfo);
            //value - apply keccak on value parameter and then pass it
            let encodedValue = '0x'+ethutil.sha3(accountInfo.value).toString('hex');
            console.log("EncodedValue",encodedValue);
            // encodedPath - apply keccak and convert from bytes32 to bytes
           // let encodedPath = ethutil.sha3(Buffer.from(accountInfo.encodedPath),'hex');

            let someValue = await merkleMock.verify.call(encodedValue, accountInfo.encodedPath, accountInfo.rlpParentNodes, accountInfo.stateRoot);
            assert.equal(someValue,true);
        })


    })

})
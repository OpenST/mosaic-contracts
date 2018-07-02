const MerklePatriciaProofMock = artifacts.require("./MerklePatriciaProofMock.sol");
const accountProofJson =  require("./data/AccountProof.json");
const storageProofJson =  require("./data/StorageProof.json");
var ethutil = require ("ethereumjs-util");


contract('MerklePatriciaProof', function(accounts) {


    var merkle= null;

    describe('Test Cases for Account proof', async () => {
        before(async () => {
            merkleMock = await MerklePatriciaProofMock.new();
        })

        it('Account Proof Successful', async () => {
            let encodedValue = '0x'+ethutil.sha3(accountProofJson.value).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, accountProofJson.encodedPath, accountProofJson.rlpParentNodes, accountProofJson.stateRoot);
            assert.equal(proofStatus,true);
        })

        it('Account Proof Unsuccessful because encoded path is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(accountProofJson.value).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, "0x01dB94fdCa0FFeDc40A6965DE97790085d71b413", accountProofJson.rlpParentNodes, accountProofJson.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because state root is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(accountProofJson.value).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, accountProofJson.encodedPath, accountProofJson.rlpParentNodes, "0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f851");
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because rlp parent nodes is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(accountProofJson.value).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, accountProofJson.encodedPath, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", accountProofJson.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because encoded value is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(accountProofJson.value).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call("0xf8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", accountProofJson.encodedPath, accountProofJson.rlpParentNodes, accountProofJson.stateRoot);
            assert.equal(proofStatus,false);
        })


    })


    describe('Test Cases for Account proof', async () => {


        it('Storage Proof for an variable successful',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[0].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, storageProofJson[0].rlpParentNodes, storageProofJson[0].root);
            assert.equal(proofStatus,true);
        })

        it('Storage Proof for an variable unsuccessful becoz encoded value is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[0].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", storageProofJson[0].path, storageProofJson[0].rlpParentNodes, storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because encoded path is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[0].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, "0xd05cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because rlp parent nodes is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[0].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because storage root is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[0].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, storageProofJson[0].rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })



        it('Storage Proof for an mapping successful',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[1].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[1].path, storageProofJson[1].rlpParentNodes, storageProofJson[1].root);
            assert.equal(proofStatus,true);
        })
        it('Storage Proof for an mapping unsuccessful becoz encoded value is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[1].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", storageProofJson[0].path, storageProofJson[0].rlpParentNodes, storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because encoded path is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[1].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, "0xd05cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because rlp parent nodes is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[1].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, "0xf9ope08cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", storageProofJson[0].root);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because storage root is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(storageProofJson[1].value).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, storageProofJson[0].path, storageProofJson[0].rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })


    })

})
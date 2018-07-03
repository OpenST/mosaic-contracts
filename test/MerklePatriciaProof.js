const MerklePatriciaProofMock = artifacts.require("./MerklePatriciaProofMock.sol");
const accountProofJson =  require("./data/AccountProof.json");
const storageProofJson =  require("./data/StorageProof.json");
const proofJson =  require("./data/proof.json");
const ethutil = require ("ethereumjs-util");
contract('MerklePatriciaProof', function(accounts) {

    let merkleMock= null;

    describe('Test Cases for Account proof', async () => {
        before(async () => {
            merkleMock = await MerklePatriciaProofMock.new();
            console.log(merkleMock);
        })

        it('Account Proof Successful', async () => {
            let encodedValue = '0x'+ethutil.sha3(proofJson.account.rlpEncodedAccount).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, proofJson.account.path, proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,true);
        })

        it('Account Proof Unsuccessful because encoded path is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(proofJson.account.rlpEncodedAccount).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, "0x01dB94fdCa0FFeDc40A6965DE97790085d71b413", proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because state root is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(proofJson.account.rlpEncodedAccount).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, proofJson.account.path, proofJson.account.rlpParentNodes, "0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f851");
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because rlp parent nodes is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(proofJson.account.rlpEncodedAccount).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call(encodedValue, proofJson.account.path, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Account Proof Unsuccessful because encoded value is incorrect', async () => {
            let encodedValue = '0x'+ethutil.sha3(proofJson.account.rlpEncodedAccount).toString('hex');
            let proofStatus = await merkleMock.verifyAccount.call("0xf8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.account.path, proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })
     })

    describe('Test Cases for Storage proof', async () => {

        it('Storage Proof for an variable successful',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.variable.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,true);
        });

        it('Storage Proof for an variable unsuccessful becoz encoded value is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.variable.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because encoded path is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.variable.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e522", proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because rlp parent nodes is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.variable.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.variable.path, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an variable unsuccessful because storage root is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.variable.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping successful',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.mapping.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,true);
        })
        it('Storage Proof for an mapping unsuccessful becoz encoded value is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.mapping.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because encoded path is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.mapping.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, "0x4d6e9a4b1a3576f692c1333198a77a5fb8b72c326f2a4c35eeeaab187773da7a", proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because rlp parent nodes is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.mapping.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.mapping.path, "0xf9e08cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Storage Proof for an mapping unsuccessful because storage root is incorrect',async () =>{

            let encodedValue = '0x'+ethutil.sha3(proofJson.storage.mapping.valueAtStorage).toString('hex');
            let proofStatus = await merkleMock.verifyStorage.call(encodedValue, proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })
    })
})
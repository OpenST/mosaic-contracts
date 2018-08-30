const MerklePatriciaProofTest = artifacts.require("./MerklePatriciaProofTest.sol");
const proofJson =  require("../data/proof.json");
contract('MerklePatriciaProof', function(accounts) {

    let merkleMock= null;

    describe('Test Cases for Account proof verification', async () => {
        before(async () => {
            merkleMock = await MerklePatriciaProofTest.new();
        })

        it('Should pass when all the parameters are valid', async () => {
            let proofStatus = await merkleMock.verifyAccount.call(proofJson.account.sha3EncodedAccount, proofJson.account.hashedPath, proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,true);
        })

        it('Should fail when path is incorrect', async () => {
            let proofStatus = await merkleMock.verifyAccount.call(proofJson.account.sha3EncodedAccount, "0x01dB94fdCa0FFeDc40A6965DE97790085d71b413", proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail when state root is incorrect', async () => {
            let proofStatus = await merkleMock.verifyAccount.call(proofJson.account.sha3EncodedAccount, proofJson.account.hashedPath, proofJson.account.rlpParentNodes, "0x58810687b84d5bddc1e9e68b2733caa4a8c6c9e7dd5d0b2f9c28b4bbf5c6f851");
            assert.equal(proofStatus,false);
        })

        it('Should fail when rlp parent nodes is incorrect', async () => {
            let proofStatus = await merkleMock.verifyAccount.call(proofJson.account.sha3EncodedAccount, proofJson.account.hashedPath, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail when encoded value is incorrect', async () => {
            let proofStatus = await merkleMock.verifyAccount.call("0xf8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.account.hashedPath, proofJson.account.rlpParentNodes, proofJson.account.stateRoot);
            assert.equal(proofStatus,false);
        })
     })

    describe('Test Cases for Storage proof', async () => {

        it('Should pass for valid variable storage',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.variable.sha3ValueAtStorage, proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,true);
        });

        it('Should fail for variable storage when encoded value is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for variable storage when encoded path is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.variable.sha3ValueAtStorage, "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e522", proofJson.storage.variable.rlpParentNodes, proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for variable storage when rlp parent nodes is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.variable.sha3ValueAtStorage, proofJson.storage.variable.path, "0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.storage.variable.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for variable storage when storage root is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.variable.sha3ValueAtStorage, proofJson.storage.variable.path, proofJson.storage.variable.rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })

        it('Should pass for valid mapping storage value',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.mapping.sha3ValueAtStorage, proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,true);
        })

        it('Should fail for mapping storage value when encoded value is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call("0x468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7c", proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for mapping storage value when encoded path is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.mapping.sha3ValueAtStorage, "0x4d6e9a4b1a3576f692c1333198a77a5fb8b72c326f2a4c35eeeaab187773da7a", proofJson.storage.mapping.rlpParentNodes, proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for mapping storage value when rlp parent nodes is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.mapping.sha3ValueAtStorage, proofJson.storage.mapping.path, "0xf9e08cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426", proofJson.storage.mapping.storageRoot);
            assert.equal(proofStatus,false);
        })

        it('Should fail for mapping storage value when storage root is incorrect',async () =>{
            let proofStatus = await merkleMock.verifyStorage.call(proofJson.storage.mapping.sha3ValueAtStorage , proofJson.storage.mapping.path, proofJson.storage.mapping.rlpParentNodes, "0xa078cef90211a0f113fc83479a9dcb7a7b5c98cdb42f2426");
            assert.equal(proofStatus,false);
        })
    })
})
const RLP = artifacts.require("./RLPMock.sol");
const ethUtil = require("ethereumjs-util");
const Utils = require('./lib/utils.js');


contract('RLP library', function(accounts) {
    before(async () => {
        rlpMock = await RLP.new();

    });
    let data =['2','5','6'];
    describe('Test Cases RLP', async () => {


         it('should pass when RLP data is correct', async () => {

            let data = ['2','5','6'];
            let dataInNibbles = ethUtil.rlp.encode(data).toString('hex');
            let result = await rlpMock.toRLPItem.call('0x'+ dataInNibbles);
            let lengthInBytes = dataInNibbles.length;
            assert.equal((lengthInBytes/2),result[0].toString(10)); //2257
            assert(result[1].toString(10));
            assert.isAtLeast(result[1].toString(10),0);
            length = result[0];
            memPtr = result[1];

        })

        it('should not return memory location when RLP is incorrect or length is 0', async () => {
            let result = await rlpMock.toRLPItem.call("");
            assert.equal(result[1].toString(10),0);
            assert.equal(result[0].toString(10),0);

        })

        it('should fail when RLP is incorrect with option strict as true', async () => {

            await Utils.expectThrow(rlpMock.toRLPItemStrict.call(data,true));

        })

        it('should pass when RLP list is correct', async () => {

            let dataInNibbles = ethUtil.rlp.encode(data).toString('hex');
            let listOfLength = await rlpMock.toList.call('0x'+ dataInNibbles);
            assert.equal(data.length,listOfLength);

        })

        it('should pass when toBytes passed correct rlp data ', async () =>{

            let dataInNibbles = ethUtil.rlp.encode(data).toString('hex');
            let result = await rlpMock.toBytes.call('0x'+ dataInNibbles);
            assert.equal(result.replace("0x",""),dataInNibbles);

        })

        it('should pass when toData is passed correct rlp data', async() => {

            let data = "1234";
            let dataInNibbles = ethUtil.rlp.encode(data).toString('hex');
            let result = await rlpMock.toData.call('0x'+ dataInNibbles);
            assert.equal(result.replace("0x",""),Buffer.from(data).toString('hex'))

        })
    })
})



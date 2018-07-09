const RLP = artifacts.require("./RLPMock.sol"),
    ethUtil = require("ethereumjs-util"),
    Utils = require('./lib/utils.js');


contract('RLP library', function (accounts) {
    let rlpMock;
    before(async () => {
        rlpMock = await RLP.new();

    });
    let dataArray = ['2', '5', '6'];
    describe('Test Cases ', async () => {

        it('should pass when RLP data is correct', async () => {

            dataInNibbles = ethUtil.rlp.encode(dataArray).toString('hex')
                , result = await rlpMock.toRLPItem.call('0x' + dataInNibbles)
                , lengthInBytes = dataInNibbles.length;
            assert.equal((lengthInBytes / 2), result[0].toString(10));
            assert.isAtLeast(result[1].toString(10), 0);

        })

        it('should fail to return memory location when RLP is incorrect or length is 0', async () => {
            let result = await rlpMock.toRLPItem.call("");
            assert.equal(result[1].toString(10), 0);
            assert.equal(result[0].toString(10), 0);

        })

        it('should fail when RLP is incorrect with option strict as true', async () => {

            await Utils.expectThrow(rlpMock.toRLPItemStrict.call(dataArray, true));

        })

        it('should pass when RLP list is correct', async () => {

            let dataInNibbles = ethUtil.rlp.encode(dataArray).toString('hex')
                , lengthOfList = await rlpMock.toList.call('0x' + dataInNibbles);
            assert.equal(dataArray.length, lengthOfList);

        })

        it('should pass when toBytes is passed with correct rlp data ', async () => {

            let dataInNibbles = ethUtil.rlp.encode(dataArray).toString('hex'),
                result = await rlpMock.toBytes.call('0x' + dataInNibbles);
            assert.equal(result.replace("0x", ""), dataInNibbles);

        })


        it('should pass when toData is passed with correct rlp data', async () => {

            let data = "1234",
                dataInNibbles = ethUtil.rlp.encode(data).toString('hex'),
                result = await rlpMock.toData.call('0x' + dataInNibbles);
            assert.equal(result.replace("0x", ""), Buffer.from(data).toString('hex'))

        })

        it('should fail when toData is passed with array of rlp data', async () => {

            let dataInNibbles = ethUtil.rlp.encode(dataArray).toString('hex');
            await Utils.expectThrow(rlpMock.toData.call('0x' + dataInNibbles));


        })
    })
})



const RLPTest = artifacts.require("./RLPTest.sol"),
    ethUtil = require("ethereumjs-util"),
    Utils = require('./lib/utils.js');

contract('RLP', function (accounts) {
    let rlpTest;
    before(async () => {
        rlpTest = await RLPTest.new();

    });
    describe('ToRLPItem', async () => {

        it('should pass when input is RLP encoded list', async () => {
            let dataArray = ['2', '5', '6','86735'];
            let hexDataArray = ethUtil.rlp.encode(dataArray).toString('hex');
            let result = await rlpTest.toRLPItem.call('0x' + hexDataArray);
            //result[0] is memory pointer and result[1] is length

            // memory pointer should be greater than 0
            assert.equal((result[0].toString(10) > 0), true);

            // length should be greater than 0
            assert.equal((result[1].toString(10) > 0), true);
        });

        it('should pass when input is RLP encoding of number', async () => {
            let data = 1234;
            let hexData = ethUtil.rlp.encode(data).toString('hex'),
                result = await rlpTest.toRLPItem.call('0x' + hexData);
            //result[0] is memory pointer and result[1] is length

            // memory pointer should be greater than 0
            assert.equal((result[0].toString(10) > 0), true);

            // length should be greater than 0
            assert.equal((result[1].toString(10) > 0), true);
        });

        it('should pass when input is blank or 0x (NOT RLP encoded)', async () => {
            let result = await rlpTest.toRLPItem.call("");
            //result[0] is memory pointer and result[1] is length

            // memory pointer should be 0
            assert.equal(result[0].toString(10), 0);

            // length should be 0
            assert.equal((result[1].toString(10)), 0);
        });

    });


    describe('ToList', async () => {

        it('should pass when input is list', async () => {
            let dataArray = ['2', '5', '6','86735'];
            let first = ['2'];
            let hexDataArray = ethUtil.rlp.encode(dataArray).toString('hex');
            let firstElement = ethUtil.rlp.encode(first).toString('hex');
            let lengthOfList = await rlpTest.toList.call('0x' + hexDataArray,firstElement);
            console.log("Array",lengthOfList);
            //assert.equal(dataArray.length, lengthOfList);
        });

        // it('should pass when input RLP encoding of empty list', async () => {
        //     let dataArray = [];
        //     let hexDataArray = ethUtil.rlp.encode(dataArray).toString('hex');
        //     let lengthOfList = await rlpTest.toList.call('0x' + hexDataArray);
        //     console.log("Data",lengthOfList);
        //     //assert.equal(dataArray.length, lengthOfList);
        // });
        //
        // it('should fail when input is non-list', async () => {
        //     let data = 1234;
        //     let hexDataArray = ethUtil.rlp.encode(data).toString('hex');
        //     await Utils.expectThrow(rlpTest.toList.call('0x' + hexDataArray));
        // });
        //
        // it('should fail when input is empty (NOT RLP encoded)', async () => {
        //     let data;
        //     await Utils.expectThrow(rlpTest.toList.call('0x' + data));
        // });
    });

    describe('ToBytes', async () => {

        it('should pass when input is list', async () => {
            let dataArray = ['2', '5', '6','86735'];
            let hexDataArray = ethUtil.rlp.encode(dataArray).toString('hex');
            let result = await rlpTest.toBytes.call('0x' + hexDataArray);
            assert.equal(result.replace("0x", ""), hexDataArray);
        })

        it('should pass when input is non-list', async () => {
            let data = 1234;
            let hexData = ethUtil.rlp.encode(data).toString('hex');
            let result = await rlpTest.toBytes.call('0x' + hexData);
            assert.equal(result.replace("0x", ""), hexData);
        })

        it('should pass when input is empty', async () => {
            let data = "";
            let result = await rlpTest.toBytes.call('0x' + data);
            assert.equal("0x", result);
        })
    })

    describe('ToData', async () => {

        it('should pass when input is non-list', async () => {
            let data = "1234",
                hexDataArray = ethUtil.rlp.encode(data).toString('hex'),
                result = await rlpTest.toData.call('0x' + hexDataArray);
            assert.equal(result.replace("0x", ""), Buffer.from(data).toString('hex'))
        })

        it('should fail when input is in list form and encoded', async () => {
            let data = ['2', '5', '6','86735'],
                hexDataArray = ethUtil.rlp.encode(data).toString('hex');
            await Utils.expectThrow(rlpTest.toData.call('0x' + hexDataArray));
        })

        it('should fail when input is in list form', async () => {
            let dataArray = ['2', '5', '6'];
            await Utils.expectThrow(rlpTest.toData.call('0x' + dataArray));
        })
    })
})



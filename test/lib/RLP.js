const RLP = require('rlp');
const Utils = require('../test_lib/utils.js');

const RLPTest = artifacts.require('TestRLP');

contract('RLP', () => {
  let rlpTest;
  before(async () => {
    rlpTest = await RLPTest.new();
  });
  describe('ToRLPItem', async () => {
    it('should pass when input is RLP encoded list', async () => {
      const dataArray = ['2', '5', '6', '86735'];

      const hexDataArray = RLP.encode(dataArray).toString('hex');

      const result = await rlpTest.toRLPItem.call(`0x${hexDataArray}`);
      // result[0] is memory pointer and result[1] is length
      // memory pointer should be greater than 0
      assert.equal(result[0].toString(10) > 0, true);

      // length should be greater than 0
      assert.equal(result[1].toString(10) > 0, true);
    });

    it('should pass when input is RLP encoding of number', async () => {
      const data = 1234;

      const hexData = RLP.encode(data).toString('hex');

      const result = await rlpTest.toRLPItem.call(`0x${hexData}`);
      // result[0] is memory pointer and result[1] is length
      // memory pointer should be greater than 0
      assert.equal(result[0].toString(10) > 0, true);

      // length should be greater than 0
      assert.equal(result[1].toString(10) > 0, true);
    });

    it('should pass when input is blank or 0x (NOT RLP encoded)', async () => {
      const result = await rlpTest.toRLPItem.call('0x');
      // result[0] is memory pointer and result[1] is length
      // memory pointer should be 0
      assert.equal(result[0].toString(10), 0);

      // length should be 0
      assert.equal(result[1].toString(10), 0);
    });
  });

  describe('ToList', async () => {
    it('should pass when list is RLP encoded of length one', async () => {
      const rlpItem = RLP.encode('5');

      const items = [rlpItem];

      const rlpArray = RLP.encode(items).toString('hex');

      const index = 0;
      const result = await rlpTest.toList.call(`0x${rlpArray}`, index);

      const itemAtIndex = result[0];
      assert.equal(`0x${rlpItem.toString('hex')}`, itemAtIndex);
    });
    it('should pass when list is RLP encoded', async () => {
      const rlpItemOne = RLP.encode('5');

      const rlpItemTwo = RLP.encode('6');

      const items = [rlpItemOne, rlpItemTwo];

      const rlpArray = RLP.encode(items).toString('hex');

      for (let index = 0; index < items.length; index += 1) {
        const result = await rlpTest.toList.call(`0x${rlpArray}`, index);

        const itemAtIndex = result[0];
        assert.equal(`0x${items[index].toString('hex')}`, itemAtIndex);
      }
    });

    it('should pass when input RLP encoding of empty list', async () => {
      const dataArray = [];

      const hexDataArray = RLP.encode(dataArray).toString('hex');

      const result = await rlpTest.toList.call(`0x${hexDataArray}`, 0);
      const length = result[1].toNumber();
      assert.equal(dataArray.length, length);
    });

    it('should fail when input is non-list', async () => {
      const data = 1234;

      const hexDataArray = RLP.encode(data).toString('hex');
      await Utils.expectThrow(rlpTest.toList.call(`0x${hexDataArray}`, 0));
    });

    it('should fail when input is empty ', async () => {
      const data = '';
      await Utils.expectThrow(rlpTest.toList.call(`0x${data}`, 0));
    });

    it('should fail when input is not RLP encoded ', async () => {
      const data = '1234';
      await Utils.expectThrow(rlpTest.toList.call(`0x${data}`, 0));
    });
  });

  describe('ToBytes', async () => {
    it('should pass when input is list', async () => {
      const dataArray = ['2', '5', '6', '86735'];

      const hexDataArray = RLP.encode(dataArray).toString('hex');

      const result = await rlpTest.toBytes.call(`0x${hexDataArray}`);
      assert.equal(result.replace('0x', ''), hexDataArray);
    });

    it('should pass when input is non-list', async () => {
      const data = 1234;

      const hexData = RLP.encode(data).toString('hex');

      const result = await rlpTest.toBytes.call(`0x${hexData}`);
      assert.equal(result.replace('0x', ''), hexData);
    });

    it('should pass when input is empty', async () => {
      const data = '';

      const result = await rlpTest.toBytes.call(`0x${data}`);
      assert.isNull(result);
    });
  });

  describe('ToData', async () => {
    it('should pass when input is non-list', async () => {
      const data = '1234';

      const hexDataArray = RLP.encode(data).toString('hex');

      const result = await rlpTest.toData.call(`0x${hexDataArray}`);
      assert.equal(
        result.replace('0x', ''),
        Buffer.from(data).toString('hex'),
      );
    });

    it('should fail when input is in list form and encoded', async () => {
      const data = ['2', '5', '6', '86735'];

      const hexDataArray = RLP.encode(data).toString('hex');
      await Utils.expectThrow(rlpTest.toData.call(`0x${hexDataArray}`));
    });

    it('should fail when input is in list form', async () => {
      const dataArray = ['2', '5', '6'];
      await Utils.expectThrow(
        rlpTest.toData.call(`0x${dataArray}`),
        'invalid bytes value',
      );
    });
  });
});

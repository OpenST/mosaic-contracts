const TokenConversionLibTest = artifacts.require("./TokenConversionLibTest.sol"),
  utils = require("./lib/utils.js");


contract('TokenConversionLib Test', function (accounts) {

  let contract;

  describe('ST to UT conversion Test', async () => {

    before(async () => {
      contract = await TokenConversionLibTest.new();
    });

    it('should convert ST to UT for 1ST = 1BT', async function () {

      let amount = 1
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert ST to UT for 1ST = 5BT', async function () {

      let amount = 1
        , conversionRate = 5
        , conversionDecimal = 0;

      let result = await contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 5);
    });

    it('should convert ST to UT with loss of precision for 1ST = 3.5BT', async function () {

      let amount = 1
        , conversionRate = 35
        , conversionDecimal = 1;

      let result = await contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 3);
    });

    it('should convert ST to UT for 5ST = 1BT', async function () {

      let amount = 5
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert ST to UT with loss of precision for 5ST = 1BT', async function () {

      let amount = 9
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });


    it('should fail if amount that needs to converted is zero', async function () {

      let amount = 0
        , conversionRate = 10
        , conversionDecimal = 1;

      utils.expectThrow(contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal));
    });

    it('should fail if conversion rate is zero', async function () {

      let amount = 1
        , conversionRate = 0
        , conversionDecimal = 1;

      utils.expectThrow(contract.calculateUTAmount.call(amount, conversionRate, conversionDecimal));

    });
  });
  describe('UT to ST conversion Test', async () => {

    before(async () => {
      contract = await TokenConversionLibTest.new();
    });

    it('should convert UT to ST for 1ST = 1BT', async function () {

      let amount = 1
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to ST for 1ST = 5BT', async function () {

      let amount = 5
        , conversionRate = 5
        , conversionDecimal = 0;

      let result = await contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to ST with loss of precision for 1ST = 3.5BT', async function () {

      let amount = 4
        , conversionRate = 35
        , conversionDecimal = 1;

      let result = await contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to ST for 5ST = 1BT', async function () {

      let amount = 2
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 10);
    });

    it('should fail if amount that needs to converted is zero', async function () {

      let amount = 0
        , conversionRate = 10
        , conversionDecimal = 1;

      utils.expectThrow(contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal));
    });

    it('should fail if conversion rate is zero', async function () {

      let amount = 1
        , conversionRate = 0
        , conversionDecimal = 1;

      utils.expectThrow(contract.calculateSTAmount.call(amount, conversionRate, conversionDecimal));

    });
  });
});
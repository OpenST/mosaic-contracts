const TokenConversionTest = artifacts.require("./TokenConversionTest.sol"),
  utils = require("./lib/utils.js");


contract('TokenConversion Test', function (accounts) {



  describe('VT to UT conversion Test', async () => {
    let contractInstance;
    before(async () => {
      contractInstance = await TokenConversionTest.new();
    });
    it('should convert VT to UT for 1VT = 1BT', async function () {

      let amount = 1
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert VT to UT for 1.5VT = 1BT with loss of 1 wei', async function () {

      let amount = 2
        , conversionRate = 66666
        , conversionDecimal = 5;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert VT to UT for 1VT = 5BT', async function () {

      let amount = 1
        , conversionRate = 5
        , conversionDecimal = 0;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 5);
    });

    it('should convert VT to UT with loss of precision for 1VT = 3.5BT', async function () {

      let amount = 1
        , conversionRate = 35
        , conversionDecimal = 1;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 3);
    });

    it('should convert VT to UT for 5VT = 1BT', async function () {

      let amount = 5
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert VT to UT with loss of precision for 5VT = 1BT', async function () {

      let amount = 9
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });


    it('should return zero if amount that needs to be converted is zero', async function () {

      let amount = 0
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contractInstance.calculateUTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 0);
    });

    it('should fail if conversion rate is zero', async function () {

      let amount = 1
        , conversionRate = 0
        , conversionDecimal = 1;

      await utils.expectThrow(contractInstance.calculateUTAmount(amount, conversionRate, conversionDecimal));
    });

  });
  describe('UT to VT conversion Test', async () => {

    let contractInstance;
    before(async () => {
      contractInstance = await TokenConversionTest.new();
    });

    it('should convert UT to VT for 1VT = 1BT', async function () {

      let amount = 1
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contractInstance.calculateVTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to VT for 1VT = 5BT', async function () {

      let amount = 5
        , conversionRate = 5
        , conversionDecimal = 0;

      let result = await contractInstance.calculateVTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to VT with loss of precision for 1VT = 3.5BT', async function () {

      let amount = 4
        , conversionRate = 35
        , conversionDecimal = 1;

      let result = await contractInstance.calculateVTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 1);
    });

    it('should convert UT to VT for 5VT = 1BT', async function () {

      let amount = 2
        , conversionRate = 20
        , conversionDecimal = 2;

      let result = await contractInstance.calculateVTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 10);
    });

    it('should return zero if amount that needs to converted is zero', async function () {

      let amount = 0
        , conversionRate = 10
        , conversionDecimal = 1;

      let result = await contractInstance.calculateVTAmount.call(amount, conversionRate, conversionDecimal);
      assert.equal(result.toNumber(), 0);
    });

    it('should fail if conversion rate is zero', async function () {

      let amount = 1
        , conversionRate = 0
        , conversionDecimal = 1;

      await utils.expectThrow(contractInstance.calculateVTAmount(amount, conversionRate, conversionDecimal));
    });

  });
});
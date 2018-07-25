const TokenConversionLibTest = artifacts.require("./TokenConversionLibTest.sol");

contract('TokenConversionLib Test', function (accounts) {

  let contract;

  describe('ST to UT conversion Test', async () => {

    before(async () => {
      contract = await TokenConversionLibTest.new();
    });

    it('should convert ST to UT for 1ST = 1BT', async function () {

      let result = await contract.calculateUTAmount.call(1, 10, 1);
      assert.equal(result.toNumber(), 1);
    });
  });
});
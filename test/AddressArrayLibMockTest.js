const AddressArrayLibMock = artifacts.require('./AddressArrayLibMock.sol');
const Utils = require('./lib/utils.js');
const BigNumber = require('bignumber.js');

contract('AddressArrayLib', function (accounts) {


  describe(' Add to array', async () => {

    let contract;
    before(async () => {
      contract = await AddressArrayLibMock.new();

    });

    it('Should be able to add item to array', async () => {
      let initialLength = await contract.length.call();
      await contract.add('0x345632343');
      let finalLength = await contract.length.call();
      assert.equal(initialLength.add(1).eq(finalLength), true);
    });

    it('Should be able to  multiple  item to array', async () => {
      let initialLength = await contract.length.call();
      await contract.add('0x4547575565566');
      await contract.add('0x4686377547555');
      await contract.add('0x5679952134567');
      let finalLength = await contract.length.call();
      assert.equal(initialLength.add(3).eq(finalLength), true);
    });

    it('Should be able to add  invalid item to array', async () => {
      await Utils.expectThrow(contract.add(0));
    });

  });


  describe(' find from array', async () => {

    let contract;
    before(async () => {
      contract = await AddressArrayLibMock.new();
      await contract.add('0x4547575565566');
      await contract.add('0x4686377547555');
      await contract.add('0x5679952134567');

    });

    it('Should be able to find item in array', async () => {
      let findResult = await contract.find.call('0x4547575565566');
      assert.equal(findResult[0], true);
      assert.equal(findResult[1].eq(new BigNumber(0)), true);

    });

    it('Should return false if element doesnot exist in the array', async () => {
      let findResult = await contract.find.call('0x470503050550');
      assert.equal(findResult[0], false);
    });

    it('Should return false if invalid element is passed in find operation', async () => {
      await Utils.expectThrow(contract.find.call(0));
    });

    it('Should return false if  element is passed in find operation in an empty array', async () => {
      let blankArray = await AddressArrayLibMock.new();
      let findResult = await blankArray.find.call('0x123456789');
      assert.equal(findResult[0], false);
    });


  });

  describe('remove from array by value', async () => {

    let contract;
    before(async () => {
      contract = await AddressArrayLibMock.new();
      await contract.add('0x4547575565566');
      await contract.add('0x4686377547555');
      await contract.add('0x5679952134567');

    });

    it('Should be able to remove item in array', async () => {
      let isSuccess = await contract.removeByValue.call('0x4547575565566');
      assert.equal(isSuccess, true);

    });

    it('Should be able to remove first occurrence  array if value exist many times', async () => {
      await contract.add('0x4547575565566');
      let isSuccess = await contract.removeByValue.call('0x4547575565566');
      assert.equal(isSuccess, true);
      let findResult = await contract.find.call('0x4547575565566');
      assert.equal(findResult[0], true);
    });

    it('Should throw exception if values is not in array', async () => {
      await Utils.expectThrow(contract.removeByValue.call('0x123456789'));
    });

    it('Should throw exception if array is blank', async () => {
      let blankArray = await AddressArrayLibMock.new();
      await Utils.expectThrow(blankArray.removeByValue.call('0x123456789'));
    });

    it('Should throw exception if invalid value is passed', async () => {
      let blankArray = await AddressArrayLibMock.new();
      await Utils.expectThrow(blankArray.removeByValue.call(0));
    });

  })

});
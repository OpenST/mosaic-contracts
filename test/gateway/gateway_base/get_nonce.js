const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');


contract('GatewayBase.sol', function (accounts) {

  describe('get nonce', async () => {
    let gatewayBaseInstance;


    beforeEach(async function () {

      let organisation = accounts[2]
        , core = accounts[0]
        , bounty = new BN(100);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        bounty,
        organisation
      );

    });

    it('should return 1 nonce if there is no active process', async function () {

      let expectedNonce = new BN(1);
      let nonce = await gatewayBaseInstance.getNonce.call(accounts[0]);
      assert(nonce.eq(expectedNonce));

    });

    it('should return nonce incremented by 1 if stake process is initiated', async function () {

     //todo implement this when stake unit tests are done
    });

    it('should return nonce incremented by 1 if linking process is initiated', async function () {

      //todo implement this when linking unit tests are done
    });


  });
});

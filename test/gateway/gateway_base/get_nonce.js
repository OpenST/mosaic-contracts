const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager.sol');

contract('GatewayBase.sol', function (accounts) {

  describe('get nonce', async () => {
    let gatewayBaseInstance;


    beforeEach(async function () {

      let owner = accounts[2]
        , worker = accounts[3]
        , anchor = accounts[0]
        , bounty = new BN(100);

      let membersManager = await MockMembersManager.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        anchor,
        bounty,
        membersManager.address
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

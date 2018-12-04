const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockWorkerManager = artifacts.require('MockWorkerManager.sol');

contract('GatewayBase.sol', function (accounts) {

  describe('get nonce', async () => {
    let gatewayBaseInstance;


    beforeEach(async function () {

      let worker = accounts[2]
        , core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      let workerManager = await MockWorkerManager.new(worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        workerManager.address
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

const GatewayBase = artifacts.require("./GatewayBase.sol")
    , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager.sol');

const NullAddress = "0x0000000000000000000000000000000000000000";

contract('GatewayBase.getNonce()', function (accounts) {

    let gatewayBaseInstance;


    beforeEach(async function () {

        let owner = accounts[2]
            , worker = accounts[3]
            , core = accounts[0]
            , bounty = new BN(100)
            , burner = NullAddress;

        let membersManager = await MockMembersManager.new(owner, worker);

        gatewayBaseInstance = await GatewayBase.new(
            core,
            bounty,
            membersManager.address,
            burner
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
});

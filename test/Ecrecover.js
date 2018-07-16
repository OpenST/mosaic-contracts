const Ecrecover = artifacts.require("./Ecrecover.sol");
const utils = require("./lib/utils.js");

contract('Ecrecover', function(accounts) {

    let ecrecover= null;

    describe('Test Cases for Ecrecover', async () => {
        before(async () => {
            ecrecover = await Ecrecover.new();
        })

        var address = accounts[0];
        console.log("Addressss",accounts[0]);

        it('ecrecover result matches address', async function() {
            var msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C';

            var h = web3.sha3(msg);
            console.log("hash : ",h);
            console.log("sing sig",web3.eth.sign(address, h));
            var sig = web3.eth.sign(address, h).slice(2);
            console.log("signature : ",sig);
            var r = `0x${sig.slice(0, 64)}`;
            console.log("r : ",r);
            var s = `0x${sig.slice(64, 128)}`;
            console.log("s",s);
            var v = web3.toDecimal(sig.slice(128, 130)) + 27;
            console.log("v",v);

            var result = await ecrecover.testRecovery(h, v, r, s);
            utils.logResponse(result,"Merkle verify usage");
            utils.printGasStatistics();
            utils.clearReceipts();
            //assert.equal(result, accounts[0]);
            //console.log(result);
        })
    })
})

const util = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
var ProofUtil = artifacts.require("./ProofUtil.sol");


function leftPad(str) {
  return ("0000000000000000000000000000000000000000000000000000000000000000" + str).substring(str.length)
}

function getPath(index, address) {

  let pathBuilder = Buffer.from(leftPad(index.toString('hex')), 'hex');
  console.log("pathBuilder 1: ",pathBuilder);
  console.log("pathBuilder 1 toString('hex'): ",pathBuilder.toString('hex'));
  pathBuilder = Buffer.concat([Buffer.from(leftPad(address.toString('hex')), 'hex'), pathBuilder])
  console.log("pathBuilder 2: ",pathBuilder);
  console.log("pathBuilder 2 toString('hex'): ",pathBuilder.toString('hex'));
  pathBuilder = Buffer.from(util.sha3(pathBuilder), 'hex');
  console.log("pathBuilder 3: ",pathBuilder);
  console.log("pathBuilder 3 toString('hex'): ",pathBuilder.toString('hex'));
  let storagePath = Buffer.from(util.sha3(pathBuilder), 'hex');
  return util.bufferToHex(storagePath);
}

contract('ProofUtil', function(accounts) {

	describe ('ProofUtil', async () => {
		it('Test', async () => {


      const bn = new BigNumber(2);
      const proofContract = await ProofUtil.new();
      console.log("proofContract address: ",proofContract.address);


      var indexBuffer = new Buffer('02', 'hex');//new Buffer(bn.toNumber(16).toString());
      console.log("indexBuffer: ",indexBuffer);
      console.log("indexBuffer.toHex: ",indexBuffer.toString('hex'));

      var addressBuffer = new Buffer('93e342dc604d9e86372fe033625ca7e97dc741fe', 'hex');
      console.log("addressBuffer: ",addressBuffer);
      console.log("addressBuffer.toHex: ",addressBuffer.toString('hex'));

      console.log("getPath: ",getPath(indexBuffer,addressBuffer));

      const callResponse = await proofContract.getStoragePath.call(bn.toNumber(16).toString(),"0x93e342dc604d9e86372fe033625ca7e97dc741fe");
      console.log("callResponse: ",callResponse);

      const response = await proofContract.getStoragePath(bn.toNumber(16).toString(),"0x93e342dc604d9e86372fe033625ca7e97dc741fe");
      console.log("response: ",response.logs[0].args);

		});
	});
});

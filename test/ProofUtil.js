
const util = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
var ProofUtil = artifacts.require("./ProofUtil.sol");


function leftPad(str) {
  return ("0000000000000000000000000000000000000000000000000000000000000000" + str).substring(str.length)
}

function getPath(index, key) {

  let pathBuilder = Buffer.from(leftPad(index.toString('hex')), 'hex');
  console.log("pathBuilder 1: ",pathBuilder);
  console.log("pathBuilder 1 toString('hex'): ",pathBuilder.toString('hex'));
  pathBuilder = Buffer.concat([Buffer.from(leftPad(key.toString('hex')), 'hex'), pathBuilder])
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

      const proofContract = await ProofUtil.new();
      console.log("proofContract address: ",proofContract.address);

      const bn = new BigNumber(2);
      var indexBuffer = new Buffer('02', 'hex');//new Buffer(bn.toNumber(16).toString());
      console.log("indexBuffer: ",indexBuffer);
      console.log("indexBuffer.toHex: ",indexBuffer.toString('hex'));

      var key = "ad7c56403eba8c288188d9f1b9bbc5d67d0119807e4505f73d02d6da76f4181d";
      var keyBuffer = new Buffer(key, 'hex');
      console.log("keyBuffer: ",keyBuffer);
      console.log("keyBuffer.toHex: ",keyBuffer.toString('hex'));

      var path = getPath(indexBuffer,keyBuffer);
      console.log("path from JS: ",path);

      const callResponse = await proofContract.getStoragePath.call(bn.toNumber(16).toString(),"0x"+key);
      console.log("callResponse: ",callResponse);

      const response = await proofContract.getStoragePath(bn.toNumber(16).toString(),"0x"+key);
      console.log("path from Contract: ",response.logs[0].args);

      assert.equal(path, response.logs[0].args.path);

		});
	});
});

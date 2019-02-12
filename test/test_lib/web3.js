const Web3 = require('web3');

const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');

module.exports = web3;

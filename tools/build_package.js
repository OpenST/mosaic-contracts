#!/usr/bin/env node

/*
 * This file runs as part of the npm packaging process.
 *
 * It reads a set number of contracts from the truffle build directory and
 * extracts ABI and BIN of each contract. The extracted information is added to
 * a new object that is finally serialized to disk. That JSON file will be
 * exported by this package.
 *
 * To add a contract to the published package, add its name to array of contract
 * names.
 */

const fs = require('fs');

const contractNames = [
    'Anchor',
    'BytesLib',
    'CircularBufferUint',
    'CoGatewayUtilityTokenInterface',
    'EIP20CoGateway',
    'EIP20Gateway',
    'EIP20Interface',
    'EIP20Token',
    'GatewayBase',
    'GatewayLib',
    'MerklePatriciaProof',
    'MessageBus',
    'Organization',
    'OrganizationInterface',
    'Organized',
    'RLP',
    'RLPEncode',
    'SafeMath',
    'SimpleStake',
    'StateRootInterface',
    'UtilityToken',
    'UtilityTokenInterface',
];

const contracts = {};

contractNames.forEach((contract) => {
    const contractFile = fs.readFileSync(`build/contracts/${contract}.json`);
    const metaData = JSON.parse(contractFile);

    contracts[contract] = {};
    contracts[contract].abi = metaData.abi;
    contracts[contract].bin = metaData.bytecode;
});

fs.writeFileSync('dist/contracts.json', JSON.stringify(contracts));

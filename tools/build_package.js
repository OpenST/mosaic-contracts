#!/usr/bin/env node

// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 * @file This file runs as part of the npm packaging process.
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
const path = require('path');

const contractNames = [
  'Anchor',
  'CoGatewayUtilityTokenInterface',
  'EIP20CoGateway',
  'EIP20Gateway',
  'EIP20Interface',
  'EIP20Token',
  'GatewayLib',
  'MerklePatriciaProof',
  'MessageBus',
  'Organization',
  'OrganizationInterface',
  'Organized',
  'OSTPrime',
  'StateRootInterface',
  'UtilityToken',
  'UtilityTokenInterface',
];

const contracts = {};

contractNames.forEach((contract) => {
  const contractPath = path.join(
    __dirname,
    `../build/contracts/${contract}.json`,
  );

  if (!fs.existsSync(contractPath)) {
    throw new Error(
      `Cannot read file ${contractPath}.`
            + 'Truffle compile must be run before building the package.'
            + 'That should be done automatically when running `npm publish`.',
    );
  }

  const contractFile = fs.readFileSync(contractPath);
  const metaData = JSON.parse(contractFile);

  contracts[contract] = {};
  contracts[contract].abi = metaData.abi;

  if (metaData.bytecode !== '0x') {
    contracts[contract].bin = metaData.bytecode;
  }
});

fs.writeFileSync('dist/contracts.json', JSON.stringify(contracts));

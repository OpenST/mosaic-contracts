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

const fs = require('fs');
const path = require('path');

var imports = 'import { ContractOptions } from "web3-eth-contract";\nimport * as contracts from "../dist/contracts.json";\n';
var interacts = '';

const contractPath = path.join(
  __dirname,
  `../dist/contracts.json`,
);

if (!fs.existsSync(contractPath)) {
  throw new Error(
    `Cannot read file ${contractPath}.`
    + 'Build package must run before generating contract interacts.'
    + 'That should be done automatically when running `npm publish`.',
  );
}

const contractFile = fs.readFileSync(contractPath);
const contractData = JSON.parse(contractFile);
const contractNames = Object.keys(contractData);

interacts = `${ interacts }const Interacts = {\n`;
contractNames.forEach((contract) => {
  const declarationFilePath = path.join(
    __dirname,
    `../interacts/${contract}.d.ts`,
  );
  if (fs.existsSync(declarationFilePath)) {
    imports = `${ imports }import { ${contract} } from "../interacts/${contract}";\n`;

    interacts = `${ interacts } 
  /**
   * ${contract} contract interact object
   * @param web3 Web3 object.
   * @param address ${contract} contract address.
   * @param options Contract options.
   *
   * @returns The ${contract} contract interact object.
   */
  get${contract}: (web3: any, address?: string, options?: ContractOptions)=> {
    const jsonInterface = contracts.${contract}.abi;
    const contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract as ${contract};
  },\n`;
    }
});

interacts = `${ interacts }\n}; 

module.exports = Interacts;

`;

fs.writeFileSync('interacts/Interacts.ts', `${ imports }\n${interacts}`);

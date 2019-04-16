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
 * This module provides CLI inquiries that you would want to use to collect the
 * configuration for a deployment.
 */

const inquirer = require('inquirer');

const inquireRpcEndpoint = (systemName) => {
  const rpcEndpointPrompts = [
    {
      name: 'rpcEndpoint',
      message: `Which RPC endpoint should be used for deployment? (${systemName} chain)`,
      type: 'list',
      default: 'http://localhost:8545',
      choices: [
        'http://localhost:8545',
        'http://localhost:8546',
        'other',
      ],
    },
    {
      when: answers => answers.rpcEndpoint === 'other',
      type: 'input',
      name: 'rpcEndpoint',
      message: 'custom RPC endpoint',
    },
  ];

  return inquirer.prompt(rpcEndpointPrompts).then(n => n.rpcEndpoint);
};

const inquireRpcEndpointOrigin = () => inquireRpcEndpoint('Origin');

const inquireRpcEndpointAuxiliary = () => inquireRpcEndpoint('Auxiliary');

const inquireDeployerAddress = async (web3, systemName) => {
  const accounts = await web3.eth.getAccounts();

  const deployerAddressPrompt = [
    {
      name: 'deployerAddress',
      message: `Which account should be used as the main deployer account on ${systemName}? (needs to be an unlocked account on the RPC)`,
      type: 'list',
      choices: accounts,
    },
  ];
  return inquirer.prompt(deployerAddressPrompt).then(n => n.deployerAddress);
};

const inquireDeployerAddressOrigin = async web3Origin => inquireDeployerAddress(web3Origin, 'Origin');

const inquireDeployerAddressAuxiliary = async web3Auxiliary => inquireDeployerAddress(web3Auxiliary, 'Auxiliary');

const inquireEIP20Address = async (message) => {
  const CHOICE_EXISTING = 'existing contract (you will be prompted for its address)';
  const CHOICE_NEW = 'deploy new token (for development)';
  const deployerAddressPrompt = [
    {
      name: 'eip20Address',
      message,
      type: 'list',
      default: CHOICE_EXISTING,
      choices: [CHOICE_EXISTING, CHOICE_NEW],
    },
    {
      name: 'eip20Address',
      message: 'contract address',
      when: answers => answers.eip20Address === CHOICE_EXISTING,
      type: 'input',
    },
  ];
  let eip20Address = await inquirer.prompt(deployerAddressPrompt).then(n => n.eip20Address);
  if (eip20Address === CHOICE_NEW) {
    eip20Address = 'new';
  }

  return eip20Address;
};

const inquireEIP20TokenAddress = async () => {
  const message = 'What is the contract address of the EIP20 token on Origin the gateway should be deployed for?';
  return inquireEIP20Address(message);
};

const inquireEIP20BaseTokenAddress = async () => {
  const message = 'What is the contract address of the EIP20 base token on Origin? (used for bounty)';
  return inquireEIP20Address(message);
};

module.exports = {
  inquireRpcEndpointOrigin,
  inquireRpcEndpointAuxiliary,
  inquireDeployerAddressOrigin,
  inquireDeployerAddressAuxiliary,
  inquireEIP20TokenAddress,
  inquireEIP20BaseTokenAddress,
};

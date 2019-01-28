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

const Web3 = require('web3');
const inquirer = require('inquirer');
const colors = require('colors/safe');

const {
    inquireDeployerAddressAuxiliary,
    inquireDeployerAddressOrigin,
    inquireEIP20TokenAddress,
    inquireEIP20BaseTokenAddress,
    inquireRpcEndpointAuxiliary,
    inquireRpcEndpointOrigin,
} = require('../cli/prompts');
const {
    checkAddressForCode,
} = require('../cli/checks');
const {
    deployAuxiliary,
    deployOrigin,
    deployedToken,
    getChainInfo,
} = require('../step1');

/**
 * Print a fancy sign with a message on the console to be used as a delimiter.
 *
 * @param {string} text The text message to use.
 */
const printSign = (text) => {
    const mainLine = '===== ' + text + ' =====';
    const delimiter = '='.repeat(mainLine.length);

    console.log();
    console.log(colors.yellow(delimiter));
    console.log(colors.yellow(mainLine));
    console.log(colors.yellow(delimiter));
    console.log();
};

const main = async () => {
    printSign('QUESTIONS ORIGIN');
    const rpcEndpointOrigin = await inquireRpcEndpointOrigin();
    const web3Origin = new Web3(rpcEndpointOrigin);
    const deployerAddressOrigin = await inquireDeployerAddressOrigin(web3Origin);

    let tokenAddressOrigin = await inquireEIP20TokenAddress(web3Origin);
    tokenAddressOrigin = await deployedToken(web3Origin, deployerAddressOrigin, tokenAddressOrigin);
    checkAddressForCode(web3Origin, tokenAddressOrigin);

    let baseTokenAddressOrigin = await inquireEIP20BaseTokenAddress();
    baseTokenAddressOrigin = await deployedToken(web3Origin, deployerAddressOrigin, baseTokenAddressOrigin);
    checkAddressForCode(web3Origin, baseTokenAddressOrigin);

    printSign('QUESTIONS AUXILIARY');
    const rpcEndpointAuxiliary = await inquireRpcEndpointAuxiliary();
    const web3Auxiliary = new Web3(rpcEndpointAuxiliary);
    const deployerAddressAuxiliary = await inquireDeployerAddressAuxiliary(web3Auxiliary);

    const bountyOrigin = '100'; // FIXME #623; inquire bounty
    const bountyAuxiliary = '100'; // FIXME #623; inquire bounty

    const originInfo = await getChainInfo(web3Origin);
    const auxiliaryInfo = await getChainInfo(web3Auxiliary);

    printSign('DEPLOYING ORIGIN');
    const originAddresses = await deployOrigin(
        web3Origin,
        deployerAddressOrigin,
        tokenAddressOrigin,
        baseTokenAddressOrigin,
        bountyOrigin,
        auxiliaryInfo.chainId,
        auxiliaryInfo.blockHeight,
        auxiliaryInfo.stateRoot,
    );

    printSign('DEPLOYING AUXILIARY');
    const gatewayAddressOrigin = originAddresses.EIP20Gateway;
    const _auxiliaryAddresses = await deployAuxiliary(
        web3Auxiliary,
        deployerAddressAuxiliary,
        tokenAddressOrigin,
        gatewayAddressOrigin,
        bountyAuxiliary,
        originInfo.chainId,
        originInfo.blockHeight,
        originInfo.stateRoot,
    );
};

main();

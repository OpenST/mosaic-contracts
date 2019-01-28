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

const chai = require('chai');
const Web3 = require('web3');
const {
    dockerSetup,
    dockerTeardown,
} = require('../docker');
const {
    deployedToken,
    getChainInfo,
    deployOrigin,
    deployAuxiliary,
} = require('../../tools/blue_deployment');

const { assert } = chai;

describe('Deployer', () => {
    let rpcEndpointOrigin;
    let web3Origin;
    let accountsOrigin;
    let rpcEndpointAuxiliary;
    let web3Auxiliary;
    let accountsAuxiliary;

    before(async () => {
        ({ rpcEndpointOrigin, rpcEndpointAuxiliary } = await dockerSetup());

        web3Origin = new Web3(rpcEndpointOrigin);
        web3Auxiliary = new Web3(rpcEndpointAuxiliary);
        accountsOrigin = await web3Origin.eth.getAccounts();
        accountsAuxiliary = await web3Auxiliary.eth.getAccounts();
    });

    after(() => {
        dockerTeardown();
    });

    let tokenAddressOrigin;
    let baseTokenAddressOrigin;
    it('correctly deploys token and base token on Origin', async () => {
        const deployerAddressOrigin = accountsOrigin[0];

        tokenAddressOrigin = await deployedToken(web3Origin, deployerAddressOrigin, 'new');
        assert(
            Web3.utils.isAddress(tokenAddressOrigin),
            'Did not correctly deploy token on Origin.',
        );

        baseTokenAddressOrigin = await deployedToken(web3Origin, deployerAddressOrigin, 'new');
        assert(
            Web3.utils.isAddress(baseTokenAddressOrigin),
            'Did not correctly deploy base token on Origin.',
        );
    });

    it('correctly deploys Gateway and CoGateway', async () => {
        const deployerAddressOrigin = accountsOrigin[0];
        const deployerAddressAuxiliary = accountsAuxiliary[0];

        const bountyOrigin = '100';
        const bountyAuxiliary = '100';

        const originInfo = await getChainInfo(web3Origin);
        const auxiliaryInfo = await getChainInfo(web3Auxiliary);

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

        const gatewayAddressOrigin = originAddresses.EIP20Gateway;
        const auxiliaryAddresses = await deployAuxiliary(
            web3Auxiliary,
            deployerAddressAuxiliary,
            tokenAddressOrigin,
            gatewayAddressOrigin,
            bountyAuxiliary,
            originInfo.chainId,
            originInfo.blockHeight,
            originInfo.stateRoot,
        );
    });
});

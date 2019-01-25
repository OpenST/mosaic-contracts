// Copyright 2018 OpenST Ltd.
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
const docker = require('../docker');
const shared = require('../shared');
const {
    tryDeployNewToken,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
} = require('../../tools/blue_deployment/step1');

const { assert } = chai;

describe('Deploy', async () => {
    let rpcEndpointOrigin;
    let web3Origin;
    let accountsOrigin;
    let rpcEndpointAuxiliary;
    let web3Auxiliary;
    let accountsAuxiliary;

    before(async () => {
        ({ rpcEndpointOrigin, rpcEndpointAuxiliary } = await docker());

        web3Origin = new Web3(rpcEndpointOrigin);
        web3Auxiliary = new Web3(rpcEndpointAuxiliary);
        accountsOrigin = await web3Origin.eth.getAccounts();
        accountsAuxiliary = await web3Auxiliary.eth.getAccounts();

        shared.origin.web3 = web3Origin;
        shared.auxiliary.web3 = web3Auxiliary;
    });

    after(async () => {
        const networkId = '*';
        const Gateway = shared.artifacts.Gateway.clone(networkId);
        Gateway.setProvider(shared.origin.web3.currentProvider);
        shared.origin.contracts.gateway = await Gateway.at(
            shared.origin.addresses.EIP20Gateway,
        );

        const CoGateway = shared.artifacts.CoGateway.clone(networkId);
        CoGateway.setProvider(shared.auxiliary.web3.currentProvider);
        shared.auxiliary.contracts.coGateway = await CoGateway.at(
            shared.auxiliary.addresses.EIP20CoGateway,
        );

        const AnchorOrigin = shared.artifacts.Anchor.clone(networkId);
        AnchorOrigin.setProvider(shared.origin.web3.currentProvider);
        shared.origin.contracts.anchor = await AnchorOrigin.at(
            shared.origin.addresses.Anchor,
        );

        const AnchorAuxiliary = shared.artifacts.Anchor.clone(networkId);
        AnchorAuxiliary.setProvider(shared.auxiliary.web3.currentProvider);
        shared.auxiliary.contracts.anchor = await AnchorAuxiliary.at(
            shared.auxiliary.addresses.Anchor,
        );
    });

    let tokenAddressOrigin;
    let baseTokenAddressOrigin;
    it('correctly deploys token and base token on Origin', async () => {
        const deployerAddressOrigin = accountsOrigin[0];

        tokenAddressOrigin = await tryDeployNewToken(
            rpcEndpointOrigin,
            deployerAddressOrigin,
            'new',
        );
        assert(
            Web3.utils.isAddress(tokenAddressOrigin),
            'Did not correctly deploy token on Origin.',
        );

        baseTokenAddressOrigin = await tryDeployNewToken(
            rpcEndpointOrigin,
            deployerAddressOrigin,
            'new',
        );
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

        const originInfo = await getChainInfo(rpcEndpointOrigin);
        const auxiliaryInfo = await getChainInfo(rpcEndpointAuxiliary);

        const originAddresses = await deployAnchorAndGateway(
            rpcEndpointOrigin,
            deployerAddressOrigin,
            tokenAddressOrigin,
            baseTokenAddressOrigin,
            bountyOrigin,
            auxiliaryInfo.chainId,
            auxiliaryInfo.blockHeight,
            auxiliaryInfo.stateRoot,
        );

        const gatewayAddressOrigin = originAddresses.EIP20Gateway;
        const auxiliaryAddresses = await deployAnchorAndCoGateway(
            rpcEndpointAuxiliary,
            deployerAddressAuxiliary,
            tokenAddressOrigin,
            gatewayAddressOrigin,
            bountyAuxiliary,
            originInfo.chainId,
            originInfo.blockHeight,
            originInfo.stateRoot,
        );

        shared.origin.addresses = originAddresses;
        shared.auxiliary.addresses = auxiliaryAddresses;
    });
});

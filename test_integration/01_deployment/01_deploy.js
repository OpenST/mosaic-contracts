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
    deployedToken,
    getChainInfo,
    deployOrigin,
    deployAuxiliary,
} = require('../../tools/blue_deployment');

const { assert } = chai;

describe('Deploy', async () => {
    let rpcEndpointOrigin;
    let web3Origin;
    let accountsOrigin;
    let rpcEndpointAuxiliary;
    let web3Auxiliary;
    let accountsAuxiliary;
    let deployerAddressOrigin;
    let deployerAddressAuxiliary;

    before(async () => {
        ({ rpcEndpointOrigin, rpcEndpointAuxiliary } = await docker());

        web3Origin = new Web3(rpcEndpointOrigin);
        web3Auxiliary = new Web3(rpcEndpointAuxiliary);
        accountsOrigin = await web3Origin.eth.getAccounts();
        accountsAuxiliary = await web3Auxiliary.eth.getAccounts();

        [deployerAddressOrigin] = accountsOrigin;
        [deployerAddressAuxiliary] = accountsAuxiliary;

        shared.origin.web3 = web3Origin;
        shared.auxiliary.web3 = web3Auxiliary;
        shared.origin.deployerAddress = deployerAddressOrigin;
        shared.auxiliary.deployerAddress = deployerAddressAuxiliary;
    });

    after(async () => {
        const networkId = '*';
        const EIP20Gateway = shared.artifacts.EIP20Gateway.clone(networkId);
        EIP20Gateway.setProvider(shared.origin.web3.currentProvider);
        shared.origin.contracts.EIP20Gateway = await EIP20Gateway.at(
            shared.origin.addresses.EIP20Gateway,
        );

        const EIP20CoGateway = shared.artifacts.EIP20CoGateway.clone(networkId);
        EIP20CoGateway.setProvider(shared.auxiliary.web3.currentProvider);
        shared.auxiliary.contracts.EIP20CoGateway = await EIP20CoGateway.at(
            shared.auxiliary.addresses.EIP20CoGateway,
        );

        const AnchorOrigin = shared.artifacts.Anchor.clone(networkId);
        AnchorOrigin.setProvider(shared.origin.web3.currentProvider);
        shared.origin.contracts.Anchor = await AnchorOrigin.at(
            shared.origin.addresses.Anchor,
        );

        const AnchorAuxiliary = shared.artifacts.Anchor.clone(networkId);
        AnchorAuxiliary.setProvider(shared.auxiliary.web3.currentProvider);
        shared.auxiliary.contracts.Anchor = await AnchorAuxiliary.at(
            shared.auxiliary.addresses.Anchor,
        );

        const BrandedToken = shared.artifacts.EIP20StandardToken.clone(networkId);
        BrandedToken.setProvider(shared.origin.web3.currentProvider);
        shared.origin.contracts.BrandedToken = await BrandedToken.at(
            shared.origin.addresses.BrandedToken,
        );
    });

    let tokenAddressOrigin;
    let baseTokenAddressOrigin;
    it('correctly deploys token and base token on Origin', async () => {
        tokenAddressOrigin = await deployedToken(
            web3Origin,
            deployerAddressOrigin,
            'new',
        );
        assert(
            Web3.utils.isAddress(tokenAddressOrigin),
            'Did not correctly deploy token on Origin.',
        );

        baseTokenAddressOrigin = await deployedToken(
            web3Origin,
            deployerAddressOrigin,
            'new',
        );
        assert(
            Web3.utils.isAddress(baseTokenAddressOrigin),
            'Did not correctly deploy base token on Origin.',
        );

        shared.origin.addresses.BrandedToken = tokenAddressOrigin;
        shared.origin.addresses.BaseToken = baseTokenAddressOrigin;
    });

    it('correctly deploys Gateway and CoGateway', async () => {
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

        shared.origin.addresses = {
            ...shared.origin.addresses,
            ...originAddresses,
        };
        shared.auxiliary.addresses = {
            ...shared.auxiliary.addresses,
            ...auxiliaryAddresses,
        };
    });
});

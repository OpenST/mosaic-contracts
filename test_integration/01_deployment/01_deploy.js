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
const BN = require('bn.js');
const docker = require('../docker');
const shared = require('../shared');
const {
  deployedToken,
  getChainInfo,
  deployOrigin,
  deployAuxiliary,
} = require('../../tools/blue_deployment');

const { assert } = chai;

// Max ost prime supply.
const TOKENS_MAX = new BN('800000000000000000000000000');

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
    shared.origin.accounts = accountsOrigin;
    shared.auxiliary.accounts = accountsAuxiliary;

    // FIXME: #623
    shared.origin.organizationAddress = deployerAddressOrigin;
    shared.auxiliary.organizationAddress = deployerAddressAuxiliary;
  });

  let tokenAddressOrigin;
  let baseTokenAddressOrigin;
  it('correctly deploys branded token and base token on Origin', async () => {
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

    /* Note that they are called Token and BaseToken! */
    shared.origin.contractAddresses.Token = tokenAddressOrigin;
    shared.origin.contractAddresses.BaseToken = baseTokenAddressOrigin;
    await shared.origin.addContract('EIP20StandardToken', 'Token');
    await shared.origin.addContract('EIP20StandardToken', 'BaseToken');
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

    shared.origin.contractAddresses = {
      ...shared.origin.contractAddresses,
      ...originAddresses,
    };
    shared.auxiliary.contractAddresses = {
      ...shared.auxiliary.contractAddresses,
      ...auxiliaryAddresses,
    };

    await shared.origin.addContract('EIP20Gateway');
    await shared.origin.addContract('Anchor');

    await shared.auxiliary.addContract('EIP20CoGateway');
    await shared.auxiliary.addContract('Anchor');
    await shared.auxiliary.addContract('OSTPrime');
  });

  it('activates the gateway ', async () => {
    const gateway = shared.origin.contracts.EIP20Gateway;

    await gateway.activateGateway(
      shared.auxiliary.contractAddresses.EIP20CoGateway,
      { from: shared.origin.organizationAddress },
    );
  });

  it('initializes and sets co-gateway in ost prime', async () => {
    const ostPrime = shared.auxiliary.contracts.OSTPrime;

    await ostPrime.initialize({
      from: shared.auxiliary.organizationAddress,
      value: TOKENS_MAX,
    });

    await ostPrime.setCoGateway(
      shared.auxiliary.contractAddresses.EIP20CoGateway,
      { from: shared.auxiliary.organizationAddress },
    );
  });
});

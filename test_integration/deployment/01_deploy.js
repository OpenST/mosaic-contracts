const chai = require('chai');
const Web3 = require('web3');
const {
    dockerNodesSetup,
    dockerNodesTeardown,
} = require('../helpers');
const {
    tryDeployNewToken,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
} = require('../../tools/blue_deployment/step1');

const { assert } = chai;

describe('Deployer', () => {
    const rpcEndpointOrigin = 'http://localhost:8546';
    const rpcEndpointAuxiliary = 'http://localhost:8547';

    let web3Origin;
    let accountsOrigin;
    let web3Auxiliary;
    let accountsAuxiliary;

    before(async () => {
        await dockerNodesSetup();

        web3Origin = new Web3(rpcEndpointOrigin);
        web3Auxiliary = new Web3(rpcEndpointAuxiliary);
        accountsOrigin = await web3Origin.eth.getAccounts();
        accountsAuxiliary = await web3Auxiliary.eth.getAccounts();
    });

    after(() => {
        dockerNodesTeardown();
    });

    let tokenAddressOrigin;
    let baseTokenAddressOrigin;
    it('correctly deploys token and base token on Origin', async () => {
        const deployerAddressOrigin = accountsOrigin[0];

        tokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, 'new');
        assert(
            Web3.utils.isAddress(tokenAddressOrigin),
            'Did not correctly deploy token on Origin.',
        );

        baseTokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, 'new');
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
    });
});

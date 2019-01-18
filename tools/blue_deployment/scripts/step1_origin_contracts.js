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
} = require('../prompts');
const {
    tryDeployNewToken,
    checkEip20Address,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
} = require('../step1');

// TODO: document
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
    const deployerAddressOrigin = await inquireDeployerAddressOrigin(rpcEndpointOrigin);

    let tokenAddressOrigin = await inquireEIP20TokenAddress(rpcEndpointOrigin);
    tokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, tokenAddressOrigin);
    checkEip20Address(rpcEndpointOrigin, tokenAddressOrigin);

    let baseTokenAddressOrigin = await inquireEIP20BaseTokenAddress(rpcEndpointOrigin);
    baseTokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, baseTokenAddressOrigin);
    checkEip20Address(rpcEndpointOrigin, baseTokenAddressOrigin);

    printSign('QUESTIONS AUXILIARY');
    const rpcEndpointAuxiliary = await inquireRpcEndpointAuxiliary();
    const deployerAddressAuxiliary = await inquireDeployerAddressAuxiliary(rpcEndpointAuxiliary);

    const bountyOrigin = '100'; // TODO: inquire bounty
    const bountyAuxiliary = '100'; // TODO: inquire bounty

    const originInfo = await getChainInfo(rpcEndpointOrigin);
    const auxiliaryInfo = await getChainInfo(rpcEndpointAuxiliary);

    printSign('DEPLOYING ORIGIN');
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

    printSign('DEPLOYING AUXILIARY');
    const gatewayAddressOrigin = originAddresses.EIP20Gateway;
    const _auxiliaryAddresses = await deployAnchorAndCoGateway(
        rpcEndpointAuxiliary,
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

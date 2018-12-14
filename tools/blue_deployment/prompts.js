const Web3 = require('web3');
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
            when: (answers) => {
                return answers.rpcEndpoint === 'other';
            },
            type: 'input',
            name: 'rpcEndpoint',
            message: 'custom RPC endpoint',
        },
    ];

    return inquirer.prompt(rpcEndpointPrompts).then(n => n.rpcEndpoint);
};

const inquireRpcEndpointOrigin = () => {
    return inquireRpcEndpoint('Origin');
};

const inquireRpcEndpointAuxiliary = () => {
    return inquireRpcEndpoint('Auxiliary');
};

const inquireDeployerAddress = async (rpcEndpoint, systemName) => {
    const web3 = new Web3(rpcEndpoint);
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

const inquireDeployerAddressOrigin = async (rpcEndpointOrigin) => {
    return inquireDeployerAddress(rpcEndpointOrigin, 'Origin');
};

const inquireDeployerAddressAuxiliary = async (rpcEndpointAuxiliary) => {
    return inquireDeployerAddress(rpcEndpointAuxiliary, 'Auxiliary');
};

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
            when: (answers) => {
                return answers.eip20Address === CHOICE_EXISTING;
            },
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

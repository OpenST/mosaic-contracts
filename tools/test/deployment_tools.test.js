const Contract = require('../deployment_tools.js').Contract;
const ContractRegistry = require('../deployment_tools.js').ContractRegistry;

const EIP20TokenFile = require('../../build/contracts/EIP20Token.json');

const rootDir = `${__dirname}/../../`;

describe('Contract', () => {
    describe('.setAddress()', () => {
        test('correctly sets a fixed address for contract', () => {
            const constructorAbi = EIP20TokenFile.abi.find(n => n.type === 'constructor');
            const EIP20Token = new Contract(EIP20TokenFile.contractName, EIP20TokenFile.bytecode, constructorAbi, ['MYT', 'MyToken', 18]);

            EIP20Token.setAddress('0x0000000000444440000000000000000000000100');

            const registry = new ContractRegistry();
            registry.addContract(EIP20Token);

            const output = registry.toParityGenesisAccounts();
            expect(Object.keys(output)).toContain('0x0000000000444440000000000000000000000100');
            expect(Object.keys(output).length).toEqual(1);
        });

        test('can not set address after instantiation', () => {
            const constructorAbi = EIP20TokenFile.abi.find(n => n.type === 'constructor');
            const EIP20Token = new Contract(EIP20TokenFile.contractName, EIP20TokenFile.bytecode, constructorAbi, ['MYT', 'MyToken', 18]);

            EIP20Token.setAddress('0x0000000000444440000000000000000000000100');
            EIP20Token.instantiate();

            expect(() => EIP20Token.setAddress('0x0000000000444440000000000000000000000100')).toThrowError();
        });
    });

    describe('.loadTruffleContract()', () => {
        test('loads correct contract when provided with rootDir option', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir: `${__dirname}/../../` },
            );

            expect(EIP20Token.contractName).toEqual('EIP20Token');
        });
    });
});


describe('ContractRegistry', () => {
    describe('toParityGenesisAccounts', () => {
        test('linking works for 2 contracts', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            const registry = new ContractRegistry();
            registry.addContracts([MerklePatriciaProof, MessageBus]);

            const output = registry.toParityGenesisAccounts();
            expect(Object.keys(output).length).toEqual(2);
            // check that link placeholders have been removed
            Object.values(output).forEach(bytecode => expect(bytecode).not.toContain('_'));
        });

        test('orders contracts correctly (correct order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = correct ordering
            const registry = new ContractRegistry();
            registry.addContracts([MerklePatriciaProof, MessageBus]);

            const output = registry.toParityGenesisAccounts();
            expect(Object.keys(output)[0]).toEqual(MerklePatriciaProof.getAddress());
            expect(Object.keys(output)[1]).toEqual(MessageBus.getAddress());
        });

        test('orders contracts correctly (wrong order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = wrong ordering
            const registry = new ContractRegistry();
            registry.addContracts([MessageBus, MerklePatriciaProof]);

            const output = registry.toParityGenesisAccounts();
            expect(Object.keys(output)[0]).toEqual(MerklePatriciaProof.getAddress());
            expect(Object.keys(output)[1]).toEqual(MessageBus.getAddress());
        });
    });
});

const Contract = require('../deployment_tools.js').Contract;
const ContractRegistry = require('../deployment_tools.js').ContractRegistry;
const IncrementingNonceAddressGenerator = require('../deployment_tools.js').IncrementingNonceAddressGenerator;

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

        test('orders contracts correctly (address reference in constructor)', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir },
            );
            const MosaicCore = Contract.loadTruffleContract('MosaicCore', [
                '0x0',
                EIP20Token.reference(),
                '0x10',
                '0x10',
                '0x10',
                '0x10',
            ], { rootDir });

            // provided ordering = wrong ordering
            const registry = new ContractRegistry();
            registry.addContracts([MosaicCore, EIP20Token]);

            const output = registry.toParityGenesisAccounts();
            expect(Object.keys(output)[0]).toEqual(EIP20Token.getAddress());
            expect(Object.keys(output)[1]).toEqual(MosaicCore.getAddress());
            expect(Object.values(output)[1].constructor).toContain(EIP20Token.getAddress().slice(2));
        });
    });

    describe('toLiveTransactionObjects', () => {
        test('returns correctly formed transaction objects', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir },
            );

            const registry = new ContractRegistry();
            registry.addContract(EIP20Token);

            const output = registry.toLiveTransactionObjects('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
            expect(output[0]).toEqual({
                from: '0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13',
                nonce: 0,
                data: EIP20Token.constructorData,

                address: '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d',
                contractName: 'EIP20Token',
            });
        });
    });
});

describe('IncrementingNonceAddressGenerator', () => {
    test('generates correct first address', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address = generator.generateAddress();

        expect(address).toEqual('0x5eceb671884153e2e312f8c5ae8e38fdc473c18d');
    });

    test('generates multiple addresses correctly', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address1 = generator.generateAddress();
        const address2 = generator.generateAddress();
        const address3 = generator.generateAddress();
        const address4 = generator.generateAddress();

        expect(address1).toEqual('0x5eceb671884153e2e312f8c5ae8e38fdc473c18d');
        expect(address2).toEqual('0x20e8a23a99c26334aed05051d6e5c6cdf50d63f6');
        expect(address3).toEqual('0xf0cd575450fc03b90eead03d65e79741a19665e4');
        expect(address4).toEqual('0x10ef71366ad76d6bddddc66677c38e137aa564db');
    });
});

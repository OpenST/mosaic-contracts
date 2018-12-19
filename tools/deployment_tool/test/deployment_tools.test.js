const chai = require('chai');
const assert = chai.assert;

const {
    Contract,
    ContractRegistry,
    IncrementingNonceAddressGenerator,
} = require('../index');

const EIP20TokenFile = require('../../../build/contracts/EIP20Token.json');

const rootDir = `${__dirname}/../../../`;

describe('Contract', () => {
    describe('.setAddress()', () => {
        it('correctly sets a fixed address for contract', () => {
            const constructorAbi = EIP20TokenFile.abi.find(n => n.type === 'constructor');
            const EIP20Token = new Contract(EIP20TokenFile.contractName, EIP20TokenFile.bytecode, constructorAbi, ['MYT', 'MyToken', 18]);

            EIP20Token.setAddress('0x0000000000444440000000000000000000000100');

            const registry = new ContractRegistry();
            registry.addContract(EIP20Token);

            const output = registry.toParityGenesisAccounts();
            assert(Object.keys(output).includes('0x0000000000444440000000000000000000000100'));
            assert.equal(Object.keys(output).length, 1);
        });

        it('can not set address after instantiation', () => {
            const constructorAbi = EIP20TokenFile.abi.find(n => n.type === 'constructor');
            const EIP20Token = new Contract(EIP20TokenFile.contractName, EIP20TokenFile.bytecode, constructorAbi, ['MYT', 'MyToken', 18]);

            EIP20Token.setAddress('0x0000000000444440000000000000000000000100');
            EIP20Token.instantiate();

            assert.throws(() => EIP20Token.setAddress('0x0000000000444440000000000000000000000100'));
        });
    });

    describe('.loadTruffleContract()', () => {
        it('loads correct contract when provided with rootDir option', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir: `${__dirname}/../../../` },
            );

            assert.equal(EIP20Token.contractName, 'EIP20Token');
        });
    });
});


describe('ContractRegistry', () => {
    describe('toParityGenesisAccounts', () => {
        it('linking works for 2 contracts', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            const registry = new ContractRegistry();
            registry.addContracts([MerklePatriciaProof, MessageBus]);

            const output = registry.toParityGenesisAccounts();
            assert.equal(Object.keys(output).length, 2);
            // check that link placeholders have been removed
            Object.values(output).forEach(bytecode => assert.isNotOk(bytecode.constructor.includes('_')));
        });

        it('orders contracts correctly (correct order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = correct ordering
            const registry = new ContractRegistry();
            registry.addContracts([MerklePatriciaProof, MessageBus]);

            const output = registry.toParityGenesisAccounts();
            assert.equal(Object.keys(output)[0], MerklePatriciaProof.getAddress());
            assert.equal(Object.keys(output)[1], MessageBus.getAddress());
        });

        it('orders contracts correctly (wrong order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = wrong ordering
            const registry = new ContractRegistry();
            registry.addContracts([MessageBus, MerklePatriciaProof]);

            const output = registry.toParityGenesisAccounts();
            assert.equal(Object.keys(output)[0], MerklePatriciaProof.getAddress());
            assert.equal(Object.keys(output)[1], MessageBus.getAddress());
        });

        it('orders contracts correctly (address reference in constructor)', () => {
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
            assert.equal(Object.keys(output)[0], EIP20Token.getAddress());
            assert.equal(Object.keys(output)[1], MosaicCore.getAddress());
            assert(Object.values(output)[1].constructor.includes(EIP20Token.getAddress().slice(2)));
        });
    });

    describe('toLiveTransactionObjects', () => {
        it('returns correctly formed transaction objects', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir },
            );

            const registry = new ContractRegistry();
            registry.addContract(EIP20Token);

            const output = registry.toLiveTransactionObjects('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
            assert.deepEqual(output[0], {
                transactionObject: {
                    from: '0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13',
                    data: EIP20Token.constructorData,
                    nonce: 0,
                },

                address: '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d',
                contractName: 'EIP20Token',
            });
        });
    });
});

describe('IncrementingNonceAddressGenerator', () => {
    it('generates correct first address', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address = generator.generateAddress();

        assert.equal(address, '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d');
    });

    it('generates multiple addresses correctly', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address1 = generator.generateAddress();
        const address2 = generator.generateAddress();
        const address3 = generator.generateAddress();
        const address4 = generator.generateAddress();

        assert.equal(address1, '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d');
        assert.equal(address2, '0x20e8a23a99c26334aed05051d6e5c6cdf50d63f6');
        assert.equal(address3, '0xf0cd575450fc03b90eead03d65e79741a19665e4');
        assert.equal(address4, '0x10ef71366ad76d6bddddc66677c38e137aa564db');
    });
});

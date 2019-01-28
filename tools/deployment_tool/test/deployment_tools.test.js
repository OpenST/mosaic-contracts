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

const { assert } = chai;

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
            assert.strictEqual(Object.keys(output).length, 1, 'Output should only contain a single address-contstructor pair');
            assert.strictEqual(Object.keys(output)[0], '0x0000000000444440000000000000000000000100', 'Address in output is different to the explicitly set address');
        });

        it('can not set address after instantiation', () => {
            const constructorAbi = EIP20TokenFile.abi.find(n => n.type === 'constructor');
            const EIP20Token = new Contract(EIP20TokenFile.contractName, EIP20TokenFile.bytecode, constructorAbi, ['MYT', 'MyToken', 18]);

            EIP20Token.setAddress('0x0000000000444440000000000000000000000100');
            EIP20Token.instantiate();

            assert.throws(
                () => EIP20Token.setAddress('0x0000000000444440000000000000000000000100'),
                null,
                null,
                "Didn't throw an Error when trying to set an address after instantiation",
            );
        });
    });

    describe('.loadTruffleContract()', () => {
        it('loads correct contract when provided with rootDir option', () => {
            const EIP20Token = Contract.loadTruffleContract(
                'EIP20Token',
                ['MYT', 'MyToken', 18],
                { rootDir: `${__dirname}/../../../` },
            );

            assert.strictEqual(
                EIP20Token.contractName,
                'EIP20Token',
                'Name of loaded contract is incorrect',
            );
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
            assert.strictEqual(Object.keys(output).length, 2, 'Output should contain both link source and link target');
            // check that link placeholders have been removed
            Object
                .values(output)
                .forEach(bytecode => assert.isNotOk(bytecode.constructor.includes('_'), 'Contract still contains linking placholder'));
        });

        it('orders contracts correctly (correct order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = correct ordering
            const registry = new ContractRegistry();
            registry.addContracts([MerklePatriciaProof, MessageBus]);

            const output = registry.toParityGenesisAccounts();
            assert.strictEqual(
                Object.keys(output)[0],
                MerklePatriciaProof.getAddress(),
                'MerklePatriciaProof is not at first output position',
            );
            assert.strictEqual(
                Object.keys(output)[1],
                MessageBus.getAddress(),
                'MessageBus is not at second output position',
            );
        });

        it('orders contracts correctly (wrong order provided)', () => {
            const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
            const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
            MessageBus.addLinkedDependency(MerklePatriciaProof);

            // provided ordering = wrong ordering
            const registry = new ContractRegistry();
            registry.addContracts([MessageBus, MerklePatriciaProof]);

            const output = registry.toParityGenesisAccounts();
            assert.strictEqual(
                Object.keys(output)[0],
                MerklePatriciaProof.getAddress(),
                'MerklePatriciaProof is not at first output position',
            );
            assert.strictEqual(
                Object.keys(output)[1],
                MessageBus.getAddress(),
                'MessageBus is not at second output position',
            );
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
            assert.strictEqual(
                Object.keys(output)[0],
                EIP20Token.getAddress(),
                'EIP20Token is not at first output position',
            );
            assert.strictEqual(
                Object.keys(output)[1],
                MosaicCore.getAddress(),
                'MosaicCore is not at second output position',
            );
            assert(
                Object.values(output)[1].constructor.includes(EIP20Token.getAddress().slice(2)),
                'EIP20Token address is not part of MosaicCore constructor bytecode',
            );
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
            assert.deepEqual(
                output[0],
                {
                    transactionObject: {
                        from: '0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13',
                        data: EIP20Token.constructorData,
                        nonce: 0,
                    },

                    address: '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d',
                    contractName: 'EIP20Token',
                },
            );
        });
    });
});

describe('IncrementingNonceAddressGenerator', () => {
    it('generates correct first address', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address = generator.generateAddress();

        assert.strictEqual(
            address,
            '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d',
            'Generated address is not the address expected for account 0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13 at nonce 0',
        );
    });

    it('generates multiple addresses correctly', () => {
        const generator = new IncrementingNonceAddressGenerator('0xc02345a911471fd46c47c4d3c2e5c85f5ae93d13', 0);
        const address1 = generator.generateAddress();
        const address2 = generator.generateAddress();
        const address3 = generator.generateAddress();
        const address4 = generator.generateAddress();

        assert.strictEqual(
            address1,
            '0x5eceb671884153e2e312f8c5ae8e38fdc473c18d',
            'Generated address is not the address expected for account at nonce 0',
        );
        assert.strictEqual(
            address2,
            '0x20e8a23a99c26334aed05051d6e5c6cdf50d63f6',
            'Generated address is not the address expected for account at nonce 1',
        );
        assert.strictEqual(
            address3,
            '0xf0cd575450fc03b90eead03d65e79741a19665e4',
            'Generated address is not the address expected for account at nonce 2',
        );
        assert.strictEqual(
            address4,
            '0x10ef71366ad76d6bddddc66677c38e137aa564db',
            'Generated address is not the address expected for account at nonce 3',
        );
    });
});

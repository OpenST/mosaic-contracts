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
// Test: OriginCore.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const eventsDecoder = require('../lib/event_decoder.js');

const OriginCore = artifacts.require('OriginCore');
const MockToken = artifacts.require('MockToken');

contract('OriginCore', async (accounts) => {
    describe('reporting a block', async () => {
        let ost;
        let originCore;

        beforeEach(async () => {
            ost = await MockToken.new();
            originCore = await OriginCore.new(3, ost.address);
        });

        it('should accept a correct block report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            await ost.approve(originCore.address, 10 ** 18);

            await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
            );

            let reportedHashs = await originCore.getReportedBlockHashes.call(blockHeight);
            // There was only a single block reported.
            assert.strictEqual(
                reportedHashs[0],
                expectedBlockHash,
                'The contract did not store the block hash that was reported.'
            );
        });

        it('should emit an event for a correct block report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            await ost.approve(originCore.address, 10 ** 18);

            let tx = await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
            );

            let events = eventsDecoder.perform(tx.receipt, originCore.address, originCore.abi);
            assert.strictEqual(
                Number(events.BlockReported.height),
                blockHeight,
                'The contract did not emit an event with the given block height.'
            );
            assert.strictEqual(
                events.BlockReported.blockHash,
                expectedBlockHash,
                'The contract did not emit an event with the given block hash.'
            );

        });

        it('should record all hashes at a single height', async () => {
            let expectedBlockHashOne = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedBlockHashTwo = '0xdedde29f6dd592919e6d855b65aa8f1b55172a83f2f4810a13758d9f58c13f54';
            let blockHeight = 0;

            await ost.approve(originCore.address, 20 ** 18);

            // Report two blocks with different hashes
            await originCore.reportBlock(
                expectedBlockHashOne,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
            );
            await originCore.reportBlock(
                expectedBlockHashTwo,
                blockHeight,
                0,
                '0x12345627d2433d8a6c50502f341f165955585b1337512e5cd9550eef62312345',
                '0x12345627d2433d8a6c50502f341f165955585b1337512e5cd9550eef62312345'
            );

            let reportedHashes = await originCore.getReportedBlockHashes.call(blockHeight);
            // There were two blocks reported in order.
            assert.strictEqual(
                reportedHashes.length,
                2,
                'Reporting two blocks should lead to two stored hashes.'
            );
            assert.strictEqual(
                reportedHashes[0],
                expectedBlockHashOne,
                'The first hash of the reported block was not stored correctly.'
            );
            assert.equal(
                reportedHashes[1],
                expectedBlockHashTwo,
                'The second hash of the reported block was not stored correctly.'
            );

        });

        it('should reject a report at the wrong height', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 17;

            await ost.approve(originCore.address, 10 ** 18);

            let hadError = false;
            try {
                await originCore.reportBlock(
                    expectedBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                );
            } catch (error) {
                // TODO: Truffle v5 will support require messages with web3 1.0
                assert(
                    error.message.search('revert') > -1,
                    'The contract should revert. Instead: ' + error.message
                );
                hadError = true;
            }

            assert(
                hadError,
                'The contract should throw an error when the height is wrong.'
            );
        });

        it('should reject a report with the wrong hash', async () => {
            let invalidBlockHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            let blockHeight = 0;

            await ost.approve(originCore.address, 10 ** 18);

            let hadError = false;
            try {
                await originCore.reportBlock(
                    invalidBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                );
            } catch (error) {
                // TODO: Truffle v5 will support require messages with web3 1.0
                assert(
                    error.message.search('revert') > -1,
                    'The contract should revert. Instead: ' + error.message
                );
                hadError = true;
            }

            assert(
                hadError,
                'The contract should throw an error when the hash is wrong.'
            );
        });

        it('should reject a duplicate report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            await ost.approve(originCore.address, 10 ** 18);

            await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
            );

            // Reporting the same block again should lead to an error.
            let hadError = false;
            try {
                await originCore.reportBlock(
                    expectedBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                );
            } catch (error) {
                // TODO: Truffle v5 will support require messages with web3 1.0
                assert(
                    error.message.search('revert') > -1,
                    'The contract should revert. Instead: ' + error.message
                );
                hadError = true;
            }

            assert(
                hadError,
                'The contract should throw an error when the block was reported before.'
            );
        });

        it('should reject a report that is not paid for', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            /*
             * Missing `approve` so the core can not transfer the tokens to
             * itself.
             */

            let hadError = false;
            try {
                await originCore.reportBlock(
                    expectedBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                );
            } catch (error) {
                // TODO: Truffle v5 will support require messages with web3 1.0
                assert(
                    error.message.search('revert') > -1,
                    'The contract should revert. Instead: ' + error.message
                );
                hadError = true;
            }

            assert(
                hadError,
                'The contract should throw an error when reporter did not approve the payment.'
            );
        });
    });
});

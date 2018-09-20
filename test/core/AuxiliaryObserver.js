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
// Test: AuxiliaryCore.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../lib/web3.js');

const eventsDecoder = require('../lib/event_decoder.js');
const utils = require('../lib/utils.js');

const AuxiliaryObserver = artifacts.require('AuxiliaryObserver');

contract('AuxiliaryObserver', async (accounts) => {
    describe('reporting a checkpoint', async () => {
        let auxiliaryObserver;

        beforeEach(async () => {
            auxiliaryObserver = await AuxiliaryObserver.new(1);
        });

        it('should accept a correct checkpoint report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 300;

            await auxiliaryObserver.reportCheckpoint(
                blockHeight,
                expectedBlockHash
            );

            let reportedCheckpoint = await auxiliaryObserver.reportedCheckpoints.call(expectedBlockHash);

            // Access properties by index
            assert.strictEqual(
                reportedCheckpoint[0].toNumber(),
                blockHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedCheckpoint[1],
                expectedBlockHash,
                'The contract did not store the block hash that was reported.'
            );
        });

        it('should emit an event for a correct checkpoint report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 1200;

            let tx = await auxiliaryObserver.reportCheckpoint(
                blockHeight,
                expectedBlockHash
            );

            let events = eventsDecoder.perform(tx.receipt, auxiliaryObserver.address, auxiliaryObserver.abi);
            assert.strictEqual(
                Number(events.CheckpointReported.height),
                blockHeight,
                'The contract did not emit an event with the given block height.'
            );
            assert.strictEqual(
                events.CheckpointReported.blockHash,
                expectedBlockHash,
                'The contract did not emit an event with the given block hash.'
            );

        });

        it('should record all checkpoints at a single height', async () => {
            let expectedBlockHashOne = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedBlockHashTwo = '0xdedde29f6dd592919e6d855b65aa8f1b55172a83f2f4810a13758d9f58c13f54';
            let blockHeight = 700;

            // Report two different block hashes
            await auxiliaryObserver.reportCheckpoint(
                blockHeight,
                expectedBlockHashOne
            );
            await auxiliaryObserver.reportCheckpoint(
                blockHeight,
                expectedBlockHashTwo
            );

            let reportedCheckpoint = await auxiliaryObserver.reportedCheckpoints.call(expectedBlockHashOne);
            // Access properties by index
            assert.strictEqual(
                reportedCheckpoint[0].toNumber(),
                blockHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedCheckpoint[1],
                expectedBlockHashOne,
                'The contract did not store the block hash that was reported.'
            );

            reportedCheckpoint = await auxiliaryObserver.reportedCheckpoints.call(expectedBlockHashTwo);
            // Access properties by index
            assert.strictEqual(
                reportedCheckpoint[0].toNumber(),
                blockHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedCheckpoint[1],
                expectedBlockHashTwo,
                'The contract did not store the block hash that was reported.'
            );
        });

        it('should reject a report with an invalid block hash', async () => {
            let invalidBlockHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            let blockHeight = 700;

            await utils.expectRevert(
                auxiliaryObserver.reportCheckpoint(
                    blockHeight,
                    invalidBlockHash
                )
            );
        });

        it('should reject a duplicate report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 700;

            await auxiliaryObserver.reportCheckpoint(
                blockHeight,
                expectedBlockHash
            );

            // Reporting the same block hash again should lead to an error.
            await utils.expectRevert(
                auxiliaryObserver.reportCheckpoint(
                    blockHeight,
                    expectedBlockHash
                )
            );
        });

        it('should reject a report where block height is not a multiple of the epoch length', async () => {
            let blockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 750;

            await utils.expectRevert(
                auxiliaryObserver.reportCheckpoint(
                    blockHeight,
                    blockHash
                )
            );
        });
    });
});

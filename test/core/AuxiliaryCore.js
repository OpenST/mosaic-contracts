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

const BigNumber = require('bignumber.js');
const eventsDecoder = require('../lib/event_decoder.js');
const utils = require('../lib/utils.js');

const AuxiliaryCore = artifacts.require('AuxiliaryCore');

contract('AuxiliaryCore', async (accounts) => {
    describe('reporting an origin block', async () => {
        let auxiliaryCore;

        beforeEach(async () => {
            auxiliaryCore = await AuxiliaryCore.new(1);
        });

        it('should accept a correct block report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 37;

            await auxiliaryCore.reportOriginBlock(
                chainHeight,
                expectedStateRoot
            );

            let reportedOriginBlock = await auxiliaryCore.reportedOriginBlocks.call(expectedStateRoot);

            // Access properties by index
            assert.strictEqual(
                reportedOriginBlock[0].toNumber(),
                chainHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedOriginBlock[1],
                expectedStateRoot,
                'The contract did not store the state root that was reported.'
            );
        });

        it('should emit an event for a correct block report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 37;

            let tx = await auxiliaryCore.reportOriginBlock(
                chainHeight,
                expectedStateRoot
            );

            let events = eventsDecoder.perform(tx.receipt, auxiliaryCore.address, auxiliaryCore.abi);
            assert.strictEqual(
                Number(events.OriginBlockReported.height),
                chainHeight,
                'The contract did not emit an event with the given chain height.'
            );
            assert.strictEqual(
                events.OriginBlockReported.stateRoot,
                expectedStateRoot,
                'The contract did not emit an event with the given state root.'
            );

        });

        it('should record all blocks at a single height', async () => {
            let expectedStateRootOne = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedStateRootTwo = '0xdedde29f6dd592919e6d855b65aa8f1b55172a83f2f4810a13758d9f58c13f54';
            let chainHeight = 33;

            // Report two different state roots
            await auxiliaryCore.reportOriginBlock(
                chainHeight,
                expectedStateRootOne
            );
            await auxiliaryCore.reportOriginBlock(
                chainHeight,
                expectedStateRootTwo
            );

            let reportedOriginBlock = await auxiliaryCore.reportedOriginBlocks.call(expectedStateRootOne);
            // Access properties by index
            assert.strictEqual(
                reportedOriginBlock[0].toNumber(),
                chainHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedOriginBlock[1],
                expectedStateRootOne,
                'The contract did not store the state root that was reported.'
            );

            reportedOriginBlock = await auxiliaryCore.reportedOriginBlocks.call(expectedStateRootTwo);
            // Access properties by index
            assert.strictEqual(
                reportedOriginBlock[0].toNumber(),
                chainHeight,
                'The contract did not store the height that was reported.'
            );
            assert.strictEqual(
                reportedOriginBlock[1],
                expectedStateRootTwo,
                'The contract did not store the state root that was reported.'
            );
        });

        it('should reject a report with an invalid state root', async () => {
            let invalidStateRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
            let chainHeight = 12;

            await utils.expectRevert(
                auxiliaryCore.reportOriginBlock(
                    chainHeight,
                    invalidStateRoot
                )
            );
        });

        it('should reject a duplicate report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 3;

            await auxiliaryCore.reportOriginBlock(
                chainHeight,
                expectedStateRoot
            );

            // Reporting the same state root again should lead to an error.
            await utils.expectRevert(
                auxiliaryCore.reportOriginBlock(
                    chainHeight,
                    expectedStateRoot
                )
            );
        });
    });
});

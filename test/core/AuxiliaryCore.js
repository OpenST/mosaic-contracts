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

const eventsDecoder = require('../lib/event_decoder.js');

const AuxiliaryCore = artifacts.require('AuxiliaryCore');

contract('OriginCore', async (accounts) => {
    describe('reporting a block', async () => {
        let auxiliaryCore;

        beforeEach(async () => {
            auxiliaryCore = await AuxiliaryCore.new(1);
        });

        it('should accept a correct state root report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 37;

            await auxiliaryCore.reportStateRoot(
                chainHeight,
                expectedStateRoot,
                {
                    from: accounts[0],
                    value: 10 ** 18
                }
            );

            let reportedStateRoots = await auxiliaryCore.getReportedStateRoots.call(chainHeight);
            // There was only a single block reported.
            assert.strictEqual(
                reportedStateRoots[0],
                expectedStateRoot,
                'The contract did not store the state root that was reported.'
            );
        });

        it('should emit an event for a correct state root report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 37;

            let tx = await auxiliaryCore.reportStateRoot(
                chainHeight,
                expectedStateRoot,
                {
                    from: accounts[0],
                    value: 10 ** 18
                }
            );

            let events = eventsDecoder.perform(tx.receipt, auxiliaryCore.address, auxiliaryCore.abi);
            assert.strictEqual(
                Number(events.StateRootReported.height),
                chainHeight,
                'The contract did not emit an event with the given chain height.'
            );
            assert.strictEqual(
                events.StateRootReported.stateRoot,
                expectedStateRoot,
                'The contract did not emit an event with the given state root.'
            );

        });

        it('should record all roots at a single height', async () => {
            let expectedStateRootOne = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedStateRootTwo = '0xdedde29f6dd592919e6d855b65aa8f1b55172a83f2f4810a13758d9f58c13f54';
            let chainHeight = 33;

            // Report two different state roots
            await auxiliaryCore.reportStateRoot(
                chainHeight,
                expectedStateRootOne,
                {
                    from: accounts[0],
                    value: 10 ** 18
                }
            );
            await auxiliaryCore.reportStateRoot(
                chainHeight,
                expectedStateRootTwo,
                {
                    from: accounts[0],
                    value: 10 ** 18
                }
            );

            let reportedStateRoots = await auxiliaryCore.getReportedStateRoots.call(chainHeight);
            // There were two roots reported in order.
            assert.strictEqual(
                reportedStateRoots.length,
                2,
                'Reporting two state roots should lead to two stored roots.'
            );
            assert.strictEqual(
                reportedStateRoots[0],
                expectedStateRootOne,
                'The first state root of the reported roots was not stored correctly.'
            );
            assert.equal(
                reportedStateRoots[1],
                expectedStateRootTwo,
                'The second state root of the reported roots was not stored correctly.'
            );

        });

        it('should reject a report with an invalid state root', async () => {
            let invalidStateRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
            let chainHeight = 12;

            let hadError = false;
            try {
                await auxiliaryCore.reportStateRoot(
                    chainHeight,
                    invalidStateRoot,
                    {
                        from: accounts[0],
                        value: 10 ** 18
                    }
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
                'The contract should throw an error when the state root is invalid.'
            );
        });

        it('should reject a duplicate report', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 3;

            await auxiliaryCore.reportStateRoot(
                chainHeight,
                expectedStateRoot,
                {
                    from: accounts[0],
                    value: 10 ** 18
                }
            );

            // Reporting the same state root again should lead to an error.
            let hadError = false;
            try {
                await auxiliaryCore.reportStateRoot(
                    chainHeight,
                    expectedStateRoot,
                    {
                        from: accounts[0],
                        value: 10 ** 18
                    }
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
                'The contract should throw an error when the state root was reported before.'
            );
        });

        it('should reject a report that is not paid for sufficiently', async () => {
            let expectedStateRoot = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let chainHeight = 3;

            let hadError = false;
            try {
                await auxiliaryCore.reportStateRoot(
                    chainHeight,
                    expectedStateRoot,
                    {
                        from: accounts[0],
                        value: 5 ** 18
                    }
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
                'The contract should throw an error when the report is not paid sufficiently.'
            );
        });

    });
});

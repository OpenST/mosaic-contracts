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

const BN = require('bn.js');
const eventsDecoder = require('../lib/event_decoder.js');
const utils = require('../lib/utils.js');

const OriginCore = artifacts.require('OriginCore');
const MockToken = artifacts.require('MockToken');

const approvalAmount = (new BN(10)).pow(new BN(18));

contract('OriginCore', async (accounts) => {
    describe('reporting a block', async () => {
        let ost;
        let originCore;

        beforeEach(async () => {
            ost = await MockToken.new();
            originCore = await OriginCore.new(3394594385, ost.address);
        });

        it('should accept a correct block report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedStateRoot = '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount);

            await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                expectedStateRoot
            );

            let reportedHeader = await originCore.reportedHeaders.call(expectedBlockHash);
            // The state root is stored at position 4 of the array.
            assert.strictEqual(
                reportedHeader[4],
                expectedStateRoot,
                'The contract did not store the block hash that was reported.'
            );
        });

        it('should increase the core\'s balance by the cost', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedStateRoot = '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount);

            await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                expectedStateRoot
            );

            let coreBalance = await ost.balanceOf.call(originCore.address);
            assert(
                coreBalance.eq(approvalAmount),
                'The core contract\'s OST balance should be equal to the cost of reporting.'
            );
        });

        it('should emit an event for a correct block report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount);

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

        it('should record multiple hashes at a single height', async () => {
            let expectedBlockHashOne = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let expectedBlockHashTwo = '0xdedde29f6dd592919e6d855b65aa8f1b55172a83f2f4810a13758d9f58c13f54';
            let expectedStateRootOne = '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0';
            let expectedStateRootTwo = '0x12345627d2433d8a6c50502f341f165955585b1337512e5cd9550eef62312345';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount.muln(2));

            // Report two blocks with different hashes
            await originCore.reportBlock(
                expectedBlockHashOne,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                expectedStateRootOne
            );
            await originCore.reportBlock(
                expectedBlockHashTwo,
                blockHeight,
                0,
                '0x12345627d2433d8a6c50502f341f165955585b1337512e5cd9550eef62312345',
                expectedStateRootTwo
            );

            let reportedHeader = await originCore.reportedHeaders.call(expectedBlockHashOne);
            // The state root is stored at position 4 of the array.
            assert.strictEqual(
                reportedHeader[4],
                expectedStateRootOne,
                'The contract did not store the block hash that was reported.'
            );

            reportedHeader = await originCore.reportedHeaders.call(expectedBlockHashTwo);
            // The state root is stored at position 4 of the array.
            assert.strictEqual(
                reportedHeader[4],
                expectedStateRootTwo,
                'The contract did not store the block hash that was reported.'
            );

        });

        it('should reject a report at the wrong height', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 17;

            await ost.approve(originCore.address, approvalAmount);

            await utils.expectRevert(
                originCore.reportBlock(
                    expectedBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                )
            );
        });

        it('should reject a report with the wrong hash', async () => {
            let invalidBlockHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount);

            await utils.expectRevert(
                originCore.reportBlock(
                    invalidBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                )
            );
        });

        it('should reject a duplicate report', async () => {
            let expectedBlockHash = '0xb59b762b2a1d476556dd6163bc8ec39967c4debec82ee534c0aed7a143939ed2';
            let blockHeight = 0;

            await ost.approve(originCore.address, approvalAmount);

            await originCore.reportBlock(
                expectedBlockHash,
                blockHeight,
                0,
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
            );

            await utils.expectRevert(
                originCore.reportBlock(
                    expectedBlockHash,
                    blockHeight,
                    0,
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0',
                    '0x82ba3527d2433d8a6c50502f341f165955585b1337512e5cd9550eef623c8fd0'
                )
            );
        });
    });
});

// // Copyright 2018 OpenST Ltd.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //    http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.
// //
// // ----------------------------------------------------------------------------
// // Test: block_store/justify.js
// //
// // http://www.simpletoken.org/
// //
// // ----------------------------------------------------------------------------

// const BN = require('bn.js');
// const EventDecoder = require('../../test_lib/event_decoder.js');
// const Utils = require('../../test_lib/utils.js');
// const RLP = require('rlp');

// const BlockStore = artifacts.require('BlockStore');

// contract('BlockStore.justify()', async (accounts) => {

//     let epochLength;
//     let pollingPlaceAddress;
//     let blockStore;
//     let rlpEncodedHeaderZero;
//     let blockHashZero;
//     let rlpEncodedHeaderTen;
//     let blockHashTen;

//     beforeEach(async () => {
//         epochLength = new BN('10');
//         pollingPlaceAddress = accounts[0];

//         blockStore = await BlockStore.new(
//             epochLength,
//             pollingPlaceAddress
//         );

//         rlpEncodedHeaderZero = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000000832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
//         blockHashZero = '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c';
//         rlpEncodedHeaderTen = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200000a832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
//         blockHashTen = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';
//         rlpEncodedHeaderTwenty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000014832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
//         blockHashTwenty = '0x29697b0bd24d4a4298c44d2a5229eec7145965c62ae5e0a21bd0466a33ecc25c';
//         rlpEncodedHeaderThirty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200001e832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
//         blockHashThirty = '0xfc01ac5155b79257c696b6b81c9d1ad713e4bf4dee8da053b1be7f80e72bad8c';

//         await blockStore.reportBlock(rlpEncodedHeaderZero);
//         await blockStore.reportBlock(rlpEncodedHeaderTen);
//         await blockStore.reportBlock(rlpEncodedHeaderTwenty);
//         await blockStore.reportBlock(rlpEncodedHeaderThirty);
//     });

//     it('should not fail on a valid justification', async () => {
//         await blockStore.justify(blockHashZero, blockHashTen);
//     });

//     it('should emit an event that a block was justified', async () => {
//         let tx = await blockStore.justify(blockHashZero, blockHashTwenty);

//         let event = EventDecoder.perform(
//             tx.receipt,
//             blockStore.address,
//             blockStore.abi
//         );

//         assert.strictEqual(
//             event.BlockJustified.blockHash,
//             blockHashTwenty,
//             'The emitted justification event should log the correct block hash.'
//         );
//     });

//     it('should emit an event that a block was finalised', async () => {
//         await blockStore.justify(blockHashZero, blockHashTen);
//         let tx = await blockStore.justify(blockHashTen, blockHashTwenty);

//         let event = EventDecoder.perform(
//             tx.receipt,
//             blockStore.address,
//             blockStore.abi
//         );

//         assert.strictEqual(
//             event.BlockFinalised.blockHash,
//             blockHashTen,
//             'The emitted finalisation event should log the correct block hash.'
//         );
//     });

//     it('should not emit a finalisation event if the distance is greater than one epoch', async () => {
//         await blockStore.justify(blockHashZero, blockHashTen);
//         let tx = await blockStore.justify(blockHashTen, blockHashThirty);

//         let event = EventDecoder.perform(
//             tx.receipt,
//             blockStore.address,
//             blockStore.abi
//         );

//         assert.strictEqual(
//             event.BlockFinalised,
//             undefined,
//             'There should not be an emitted finalisation event if the distance is greater than one epoch length.'
//         );
//     });

// });

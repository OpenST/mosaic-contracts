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
// // Test: block_store/constructor.js
// //
// // http://www.simpletoken.org/
// //
// // ----------------------------------------------------------------------------

// const BN = require('bn.js');
// const Utils = require('../../test_lib/utils.js');

// const BlockStore = artifacts.require('BlockStore');

// contract('BlockStore.constructor()', async (accounts) => {

//     it('should accept valid arguments', async () => {
//         await BlockStore.new(
//             new BN('10'),
//             accounts[0]
//         );
//     });

//     it('should not accept a zero epoch length', async () => {
//         await Utils.expectRevert(
//             BlockStore.new(
//                 new BN('0'),
//                 accounts[0]
//             ),
//             'Epoch length must be greater zero.'
//         );
//     });

//     it('should not accept a zero polling place address', async () => {
//         await Utils.expectRevert(
//             BlockStore.new(
//                 new BN('10'),
//                 '0x0000000000000000000000000000000000000000'
//             ),
//             'Address of polling place must not be zero.'
//         );
//     });

// });

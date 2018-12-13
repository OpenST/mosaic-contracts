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

const BN = require('bn.js');

const CircularBufferUint = artifacts.require('TestCircularBufferUint');

contract('CircularBufferUint.store()', async (accounts) => {

    it('stores the given number of max items', async () => {
        let data = [
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(1),
            new BN(2),
            new BN(3),
            new BN(4),
            new BN(5),
            new BN(6),
            new BN(7),
            new BN(8),
            new BN(9),
            new BN(10),
            new BN(11),
            new BN(12),
            new BN(13),
            new BN(14),
            new BN(15),
            new BN(16),
            new BN(17),
            new BN(18),
            new BN(19),
            new BN(20),
        ];

        let bufferLength = 10;
        let buffer = await CircularBufferUint.new(new BN(bufferLength));

        let count = data.length;
        for (let i = bufferLength; i < count; i++) {
            let previousItem = await buffer.storeExternal.call(data[i]);
            let expectedPreviousItem = data[i - bufferLength];
            assert(
                previousItem.eq(expectedPreviousItem),
                'The contract did not return the expected item that should ' +
                'have been overwritten.',
            );

            await buffer.storeExternal(data[i]);
            let head = await buffer.headExternal.call();
            let expectedHead = data[i];
            assert(
                head.eq(expectedHead),
                'The contract did not update the head to the latest stored item.',
            );
        }
    });
});

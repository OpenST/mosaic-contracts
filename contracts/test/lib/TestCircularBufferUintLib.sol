pragma solidity ^0.5.0;

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

import "../../lib/CircularBufferUintLib.sol";

/**
 * @title Test contract for the circular buffer for `uint`s.
 *
 * @notice The methods on the circular buffer are internal and therefore not
 *         testable from the JS layer. This proxy contract wraps the original
 *         implementation and exposes external methods which proxy the internal
 *         methods of the circular buffer under test.
 */
contract TestCircularBufferUintLib {

    CircularBufferUintLib.BufferUint public storageBuffer;

    /**
     * @notice Set the max item size for storage buffer.
     *
     * @param _maxItems Defines how many items this test buffer stores before
     *                  overwriting older items.
     */
    function setMaxItemLimit(uint256 _maxItems) external {
        CircularBufferUintLib.setMaxItemLimit(
            _maxItems,
            storageBuffer
        );
    }

    /**
     * @notice Store a new item in the circular test buffer.
     *
     * @param _item The item to store in the circular test buffer.
     *
     * @return overwrittenItem_ The item that was in the circular test buffer's
     *                          position where the new item is now stored. The
     *                          overwritten item is no longer available in the
     *                          circular test buffer.
     */
    function store(uint256 _item) external returns(uint256 overwrittenItem_) {
        overwrittenItem_ = CircularBufferUintLib.store(_item, storageBuffer);
    }

    /**
     * @notice Get the most recent item that was stored in the circular test
     *         buffer.
     *
     * @return head_ The most recently stored item.
     */
    function head() external view returns(uint256 head_) {
        head_ = CircularBufferUintLib.head(storageBuffer);
    }

    /**
     * @notice Get the max item size of the circular test buffer.
     *
     * @return maxItems_ The max item size of circular test buffer.
     */
    function getMaxItemLimit() external view returns (uint256 maxItems_) {
        maxItems_ = storageBuffer.items.length;
    }
}

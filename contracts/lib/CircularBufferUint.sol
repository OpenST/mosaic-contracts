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

/**
 * @title Circular buffer for `uint`s.
 *
 * @notice This contract represents a circular buffer that stores `uint`s. When
 *         a set number of `uint`s have been stored, the storage starts
 *         overwriting older entries. It overwrites always the oldest entry in
 *         the buffer.
 */
contract CircularBufferUint {

    /* Storage */

    /**
     * The circular buffer that stores the latest `items.length` items. Once
     * `items.length` items were stored, items will be overwritten starting at
     * zero.
     */
    uint256[] private items;

    /**
     * The current index in the items array. The index increases up to
     * `items.length - 1` and then resets to zero in an endless loop. This
     * means that a new item will always overwrite the oldest item.
     */
    uint256 private index;


    /* Constructor */

    /**
     * @notice Create a new buffer with the size `_maxItems`.
     *
     * @param _maxItems Defines how many items this buffer stores before
     *                  overwriting older items.
     */
    constructor(uint256 _maxItems) public {
        require(
            _maxItems > 0,
            "The max number of items to store in a circular buffer must be greater than 0."
        );

        items.length = _maxItems;
    }


    /* Internal functions */

    /**
     * @notice Store a new item in the circular buffer.
     *
     * @param _item The item to store in the circular buffer.
     *
     * @return overwrittenItem_ The item that was in the circular buffer's
     *                          position where the new item is now stored. The
     *                          overwritten item is no longer available in the
     *                          circular buffer.
     */
    function store(uint256 _item) internal returns(uint256 overwrittenItem_) {
        nextIndex();

        /*
         * Retrieve the old item from the circular buffer before overwriting it
         * with the new item.
         */
        overwrittenItem_ = items[index];
        items[index] = _item;
    }

    /**
     * @notice Get the most recent item that was stored in the circular buffer.
     *
     * @return head_ The most recently stored item.
     */
    function head() internal view returns(uint256 head_) {
        head_ = items[index];
    }


    /* Private functions */

    /**
     * @notice Updates the index of the circular buffer to point to the next
     *         slot of where to store an item. Resets to zero if it gets to the
     *         end of the array that represents the circular.
     */
    function nextIndex() private {
        index++;
        if (index == items.length) {
            index = 0;
        }
    }
}

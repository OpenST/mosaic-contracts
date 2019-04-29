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
 * @notice This library represents a circular buffer that stores `uint`s. When
 *         a set number of `uint`s have been stored, the storage starts
 *         overwriting older entries. It overwrites always the oldest entry in
 *         the buffer.
 */
library CircularBufferUintLib {

    struct BufferUint {
        /**
         * The circular buffer that stores the latest `items.length` items. Once
         * `items.length` items were stored, items will be overwritten starting at
         * zero.
         */
        uint256[] items;

        /**
         * The current index in the items array. The index increases up to
         * `items.length - 1` and then resets to zero in an endless loop. This
         * means that a new item will always overwrite the oldest item.
         */
        uint256 index;
    }


    /* Internal functions */

    /**
     * @notice Set buffer max item limit/
     *
     * @param _maxItems The item to store in the circular buffer.
     * @param _buffer Uint buffer.
     */
    function setMaxItemLimit(
        uint256 _maxItems,
        BufferUint storage _buffer
    )
        internal
    {
        require(
            _buffer.items.length == 0,
            "Buffer max item limit is already set."
        );

        require(
            _maxItems > 0,
            "The max number of items to store in a circular buffer must be greater than 0."
        );

        _buffer.items.length = _maxItems;
    }

    /**
     * @notice Store a new item in the circular buffer.
     *
     * @param _item The item to store in the circular buffer.
     * @param _buffer The circular buffer.
     *
     * @return overwrittenItem_ The item that was in the circular buffer's
     *                          position where the new item is now stored. The
     *                          overwritten item is no longer available in the
     *                          circular buffer.
     */
    function store(
        uint256 _item,
        BufferUint storage _buffer
    )
        internal
        returns(
            uint256 overwrittenItem_
        )
    {
        require(
            _buffer.items.length > 0,
            "Buffer max item limit is not set."
        );

        nextIndex(_buffer);

        overwrittenItem_ = _buffer.items[_buffer.index];
        _buffer.items[_buffer.index] = _item;

    }

    /**
     * @notice Get the most recent item that was stored in the circular buffer.
     *
     * @param _buffer The circular buffer.
     *
     * @return head_ The most recently stored item.
     */
    function head(
        BufferUint storage _buffer
    )
        internal
        view
        returns(uint256 head_)
    {
        require(
            _buffer.items.length > 0,
            "Buffer max item limit is not set."
        );
        head_ = _buffer.items[_buffer.index];
    }


    /* Private functions */

    /**
     * @notice Updates the index of the circular buffer to point to the next
     *         slot of where to store an item. Resets to zero if it gets to the
     *         end of the array that represents the circular.
     *
     * @param _buffer The circular buffer.
     */
    function nextIndex(
        BufferUint storage _buffer
    )
        private
    {
        _buffer.index++;
        if (_buffer.index == _buffer.items.length) {
            _buffer.index = 0;
        }
    }
}

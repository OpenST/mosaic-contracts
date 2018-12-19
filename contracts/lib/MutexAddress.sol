pragma solidity ^0.5.0;

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

/** @title MutexAddress contract provide locking mechanism. */
contract MutexAddress {

    /* Storage */

    /** Mapping of address and lock status. */
    mapping(address => bool) private locks;


    /* Constructor */

    constructor() public
    { }

    /**
     * @notice This acquires lock for an address if not already acquired.
     *          This will revert the transaction if lock is already acquired.
     *
     * @param _address Address for which lock acquisition is required.
     *
     * @return isAcquired_ `true` on successful lock acquisition, `false` otherwise.
     */
    function acquire(address _address)
        internal
        returns(bool isAcquired_)
    {
        require(
            locks[_address] == false,
            "Lock already acquired for the address."
        );

        locks[msg.sender] = true;
        isAcquired_ = true;
    }

    /**
     * @notice This releases lock for an address if lock is acquired.
     *          This will revert the transaction if lock is not acquired.
     *
     * @param _address Address for which release lock is required.
     *
     * @return isReleased_ `true` on successful lock release, `false` otherwise.
     */
    function release(address _address)
        internal
        returns(bool isReleased_)
    {
        require(
            locks[_address] == true,
            "Lock is not acquired for the address."
        );

        locks[_address] = false;
        isReleased_ = true;
    }
}

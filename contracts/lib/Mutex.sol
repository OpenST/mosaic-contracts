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

/** @title Mutex contract provide locking mechanism. */
contract Mutex {

    /* Storage */

    bool private mutexAcquired;


    /* Modifiers */

    /**
     *  Checks that mutex is acquired or not. If mutex is not acquired,
     *  mutexAcquired is set to true. At the end of function execution,
     *  mutexAcquired is set to false.
     */
    modifier mutex() {
        require(
            !mutexAcquired,
            "Mutex is already acquired."
        );
        mutexAcquired = true;
        _;
        mutexAcquired = false;
    }
}

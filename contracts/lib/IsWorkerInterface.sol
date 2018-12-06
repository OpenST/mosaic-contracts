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

/**
 *  @title IsWorkerInterface provides a method to check if an address is
 *         currently registered as an active worker.
 */
interface IsWorkerInterface {

    /**
     * @notice Checks if an address is currently registered as an active worker.
     *
     * @param _worker Address to check.
     *
     * @return isWorker_ True if the worker is already added and expiration
     *                   height is more than or equal to current block number.
     *                   Returns false otherwise.
     */
    function isWorker(address _worker) external view returns (bool isWorker_);

}

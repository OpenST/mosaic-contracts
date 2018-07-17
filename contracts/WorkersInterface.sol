pragma solidity ^0.4.23;

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
// Value chain: WorkersInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title WorkersInterface contract.
 *
 *  @notice Provides an interface to workers contract.
 */
contract WorkersInterface {

    /**
     *  @notice External function setWorker.
     *
     *  @dev Takes _worker, _deactivationHeight,
     *       Sets worker and its deactivation height.
     *
     *  @param _worker Worker address.
     *  @param _deactivationHeight Deactivation Height.
     *
     *  @return uint256 Remaining activation length.
     */
    function setWorker(
        address _worker,
        uint256 _deactivationHeight)
        external
        returns (uint256 /* remaining activation length */);

    /**
     *  @notice External function removeWorker.
     *  
     *  @dev Takes _worker and removes the worker.
     *
     *  @param _worker Worker address.
     *
     *  @return bool true if existed, false otherwise.
     */
    function removeWorker(
        address _worker)
        external
        returns (bool /* existed */);
    
    /**
     *  @notice External function remove.
     *
     *  @dev Clean up or collectively revoke all workers.
     *       Only callable by ops or admin.
     */   
    function remove()
        external;

    /**
     *  @notice External function isWorker.
     *
     *  @dev Takes _worker, checks if the worker is valid. 
     *
     *  @param _worker Worker address.
     *
     *  @return bool True if worker is valid, false otherwise.
     */     
    function isWorker(
        address _worker)
        external
        view
        returns (bool /* is active worker */);

    /**
     *  @notice External function approve.
     *
     *  @dev Takes _spender and _amount, approves spender to spend amount.
     *
     *  @param _spender Spender address.
     *  @param _amount Amount to approve for spender.
     *
     *  @return bool True if spender approved, false otherwise.
     */
    function approve(
        address _spender,
        uint256 _amount)
        external
        returns (bool success);

}
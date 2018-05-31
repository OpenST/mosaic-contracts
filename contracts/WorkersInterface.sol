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

/// A set of authorised workers
contract WorkersInterface {

    function setWorker(
        address _worker,
        uint256 _deactivationHeight)
        external
        returns (uint256 /* remaining activation length */);

    /// @dev    Takes _worker;
    ///         removes the worker; 
    ///         external method;
    /// @param _worker worker
    /// @return (existed)    
    function removeWorker(
        address _worker)
        external
        returns (bool /* existed */);
    
    /// @dev    Clean up or collectively revoke all workers;
    ///         external method;
    ///         only called by ops or admin;    
    function remove()
        external;

    /// @dev    Takes _worker;
    ///         checks if the worker is valid; 
    ///         external method;
    /// @param _worker worker
    /// @return (isValid)    
    function isWorker(
        address _worker)
        external
        view
        returns (bool /* is active worker */);

    function approve(
        address _spender,
        uint256 _amount)
        external
        returns (bool success);

}
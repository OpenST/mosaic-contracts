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
// Value chain: Workers
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./EIP20Interface.sol";
import "./OpsManaged.sol";
import "./WorkersInterface.sol";

/// A set of authorised workers
contract Workers is WorkersInterface, OpsManaged {
    using SafeMath for uint256;
    /// EIP20token address is private for now.
    EIP20Interface private eip20token;
    /*
     *  Storage
     */
    /// workers are active up unto the deactivation height
    mapping(address => uint256 /* deactivation height */) public workers;

    /*
     * Events
     */
    ///Event for worker set
    event WorkerSet(
        address indexed _worker,
        uint256 indexed _deactivationHeight,
        uint256 _remainingHeight);

    ///Event for worker removed
    event WorkerRemoved(
        address indexed _worker,
        bool _existed);

    /// @dev    Constructor;
    ///         public method;    
    constructor(
        address _eip20token)
        public
        OpsManaged()
    {
        require(_eip20token != address(0));
        
        eip20token = EIP20Interface(_eip20token);
    }

    /// @dev    Takes _worker, _deactivationHeight;
    ///         Sets worker and its deactivation height; 
    ///         external method;
    /// @param _worker worker
    /// @param _deactivationHeight deactivationHeight
    /// @return (remainingHeight)    
    function setWorker(
        address _worker,
        uint256 _deactivationHeight)
        external
        onlyOps()
        returns (uint256 /* remaining activation length */)
    {
        require(_worker != address(0));
        require(_deactivationHeight >= block.number);

        workers[_worker] = _deactivationHeight;
        uint256 remainingHeight = _deactivationHeight.sub(block.number);
        //Event for worker set
        emit WorkerSet(_worker, _deactivationHeight, remainingHeight);

        return (remainingHeight);
    }

    /// @dev    Takes _worker;
    ///         removes the worker; 
    ///         external method;
    /// @param _worker worker
    /// @return (existed)    
    function removeWorker(
        address _worker)
        external
        onlyOps()
        returns (bool existed)
    {
        existed = (workers[_worker] > 0);

        delete workers[_worker];
        //Event for worker removed
        emit WorkerRemoved(_worker, existed);

        return existed;
    }
    
    /// @dev    Clean up or collectively revoke all workers;
    ///         external method;
    ///         only called by ops or admin;    
    function remove()
        external
        onlyAdminOrOps()
    {
        selfdestruct(msg.sender);
    }

    /// @dev    Takes _worker;
    ///         checks if the worker is valid; 
    ///         external method;
    /// @param _worker worker
    /// @return (isValid)    
    function isWorker(
        address _worker)
        external
        view
        returns (bool /* is active worker */)
    {
        return (workers[_worker] >= block.number);
    }

    function approve(
        address _spender,
        uint256 _amount)
        external
        onlyOps()
        returns (bool success)
    {
        /// approve the spender for the amount
        require(eip20token.approve(_spender, _amount));

        return true;
    }

}
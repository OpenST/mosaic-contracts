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

/**
 *  @title Workers contract which implement WorkersInterface, OpsManaged.
 *
 *  @notice A set of authorised workers.
 */
contract Workers is WorkersInterface, OpsManaged {
    using SafeMath for uint256;

    /** Constants */
    
    EIP20Interface private eip20token;
    
    /**  Storage */
    /** Workers are not active once the deactivation height is passed. */
    mapping(address => uint256 /* deactivation height */) public workers;

    /** Events */

    /** Event for worker set. */
    event WorkerSet(
        address indexed _worker,
        uint256 indexed _deactivationHeight,
        uint256 _remainingHeight);

    /** Event for worker removed. */
    event WorkerRemoved(
        address indexed _worker,
        bool _existed);

    /**
     *  @notice Contract constructor.
     *
     *  @dev Sets the EIP20TokenInterface address.
     * 
     *  @param _eip20token Address of the EIP20Token.
     */  
    constructor(
        address _eip20token)
        public
        OpsManaged()
    {
        require(_eip20token != address(0));
        
        eip20token = EIP20Interface(_eip20token);
    }

    /** External Functions */
    
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
        onlyOps()
        returns (bool existed)
    {
        existed = (workers[_worker] > 0);

        delete workers[_worker];
        //Event for worker removed
        emit WorkerRemoved(_worker, existed);

        return existed;
    }

    /**
     *  @notice External function remove.
     *
     *  @dev Clean up or collectively revoke all workers.
     *       Only callable by ops or admin.
     */ 
    function remove()
        external
        onlyAdminOrOps()
    {
        selfdestruct(msg.sender);
    }

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
        returns (bool /* is active worker */)
    {
        return (workers[_worker] >= block.number);
    }
    
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
        onlyOps()
        returns (bool success)
    {
        require(eip20token.approve(_spender, _amount));

        return true;
    }

}
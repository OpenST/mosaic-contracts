pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
// Common: Admin / Ops Permission Model
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./Owned.sol";

/**
 *  @title OpsManaged contract which implements Owned.
 *
 *  @notice Implements OpenST ownership and permission model.
 */
contract OpsManaged is Owned {

    /** Events */
    
    event AdminAddressChanged(address indexed _newAddress);
    event OpsAddressChanged(address indexed _newAddress);

    /** Storage */

    address public opsAddress;
    address public adminAddress;

    /**
     *  @notice Contract constructor.
     */
    constructor() public
        Owned()
    {
    }

    /** Modifiers */

    /**
     *  @notice Modifier onlyAdmin.
     *
     *  @dev Checks if called by Admin to proceed.
     */
    modifier onlyAdmin() {
        require(isAdmin(msg.sender));
        _;
    }

    /**
     *  @notice Modifier onlyAdminOrOps.
     *
     *  @dev Checks if called by Admin or Ops to proceed.
     */
    modifier onlyAdminOrOps() {
        require(isAdmin(msg.sender) || isOps(msg.sender));
        _;
    }

    /**
     *  @notice Modifier onlyOwnerOrAdmin.
     *
     *  @dev Checks if called by Owner or Admin to proceed.
     */
    modifier onlyOwnerOrAdmin() {
        require(isOwner(msg.sender) || isAdmin(msg.sender));
        _;
    }

    /**
     *  @notice Modifier onlyOps.
     *
     *  @dev Checks if called by Ops to proceed.
     */
    modifier onlyOps() {
        require(isOps(msg.sender));
        _;
    }

    /**
     *  @notice Internal view function isAdmin.
     *
     *  @param _address Address to check.
     *
     *  @return bool True if Admin's address, false otherwise.
     */
    function isAdmin(address _address) internal view returns (bool) {
        return (adminAddress != address(0) && _address == adminAddress);
    }

    /**
     *  @notice Internal view function isOps.
     *
     *  @param _address Address to check.
     *
     *  @return bool True if Ops's address, false otherwise.
     */
    function isOps(address _address) internal view returns (bool) {
        return (opsAddress != address(0) && _address == opsAddress);
    }

    /**
     *  @notice Internal view function isOwnerOrOps.
     * 
     *  @param _address Address to check.
     *
     *  @return bool True if Owner's or Ops address, false otherwise.
     */
    function isOwnerOrOps(address _address) internal view returns (bool) {
        return (isOwner(_address) || isOps(_address));
    }


    /**
     *  @notice External function setAdminAddress.
     * 
     *  @dev Only callable by Owner or Admin, address can also be set to 0 to 'disable' it.
     * 
     *  @param _adminAddress Address to set.
     *
     *  @return bool True if set as Admin's address, false otherwise.
     */
    function setAdminAddress(address _adminAddress) external onlyOwnerOrAdmin returns (bool) {
        require(_adminAddress != owner);
        require(_adminAddress != address(this));
        require(!isOps(_adminAddress));

        adminAddress = _adminAddress;

        emit AdminAddressChanged(_adminAddress);

        return true;
    }


    /**
     *  @notice External function setOpsAddress.
     * 
     *  @dev Only callable by Owner or Admin, address can also be set to 0 to 'disable' it.
     * 
     *  @param _opsAddress Address to set.
     *
     *  @return bool True if set as Ops's address, false otherwise.
     */
    function setOpsAddress(address _opsAddress) external onlyOwnerOrAdmin returns (bool) {
        require(_opsAddress != owner);
        require(_opsAddress != address(this));
        require(!isAdmin(_opsAddress));

        opsAddress = _opsAddress;

        emit OpsAddressChanged(_opsAddress);

        return true;
    }
}



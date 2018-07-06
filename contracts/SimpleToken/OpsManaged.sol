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
// Admin / Ops Permission Model
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./Owned.sol";

/**
 *  @title OpsManaged which implements Owned
 *
 *  @notice Implements OpenST ownership and permission model
 */
contract OpsManaged is Owned {

    address public opsAddress;
    address public adminAddress;

    event AdminAddressChanged(address indexed _newAddress);
    event OpsAddressChanged(address indexed _newAddress);

    /**
     *  @notice Contract constructor
     * 
     *  @dev only callable by Owned
     */
    constructor() public
        Owned()
    {
    }

    /**
     *  @notice modifier onlyAdmin
     * 
     *  @dev checks if modifier caller isAdmin
     */
    modifier onlyAdmin() {
        require(isAdmin(msg.sender));
        _;
    }

    /**
     *  @notice modifier onlyAdminOrOps
     * 
     *  @dev checks if modifier caller isAdmin or isOps
     */
    modifier onlyAdminOrOps() {
        require(isAdmin(msg.sender) || isOps(msg.sender));
        _;
    }

    /**
     *  @notice modifier onlyOwnerOrAdmin
     * 
     *  @dev checks if modifier caller isOwner or isAdmin
     */
    modifier onlyOwnerOrAdmin() {
        require(isOwner(msg.sender) || isAdmin(msg.sender));
        _;
    }

    /**
     *  @notice modifier onlyOps
     * 
     *  @dev checks if modifier caller isOps
     */
    modifier onlyOps() {
        require(isOps(msg.sender));
        _;
    }

    /**
     *  @notice internal view function isAdmin
     * 
     *  @param _address address to be checked
     *
     *  @return bool true if address passed is adminAddress, false otherwise
     */
    function isAdmin(address _address) internal view returns (bool) {
        return (adminAddress != address(0) && _address == adminAddress);
    }

    /**
     *  @notice internal view function isOps
     * 
     *  @param _address address to be checked
     *
     *  @return bool true if address passed is opsAddress, false otherwise
     */
    function isOps(address _address) internal view returns (bool) {
        return (opsAddress != address(0) && _address == opsAddress);
    }

    /**
     *  @notice internal view function isOwnerOrOps
     * 
     *  @param _address address to be checked
     *
     *  @return bool true if address passed isOwner or isOps, false otherwise
     */
    function isOwnerOrOps(address _address) internal view returns (bool) {
        return (isOwner(_address) || isOps(_address));
    }

    /**
     *  @notice external function setAdminAddress
     * 
     *  @dev function callable by onlyOwnerOrAdmin, address can also be set to 0 to 'disable' it
     * 
     *  @param _adminAddress address to be set
     *
     *  @return bool true if address passed is set as adminAddress, false otherwise
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
     *  @notice external function setOpsAddress
     * 
     *  @dev function callable by onlyOwnerOrAdmin, address can also be set to 0 to 'disable' it
     * 
     *  @param _opsAddress address to be set
     *
     *  @return bool true if address passed is set as opsAddress, false otherwise
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



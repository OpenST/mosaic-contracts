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
   @title OpsManaged
   @notice Implements OpenST ownership and permission model
*/
contract OpsManaged is Owned {

    address public opsAddress;
    address public adminAddress;

    event AdminAddressChanged(address indexed _newAddress);
    event OpsAddressChanged(address indexed _newAddress);


    constructor() public
        Owned()
    {
    }


    modifier onlyAdmin() {
        require(isAdmin(msg.sender));
        _;
    }


    modifier onlyAdminOrOps() {
        require(isAdmin(msg.sender) || isOps(msg.sender));
        _;
    }


    modifier onlyOwnerOrAdmin() {
        require(isOwner(msg.sender) || isAdmin(msg.sender));
        _;
    }


    modifier onlyOps() {
        require(isOps(msg.sender));
        _;
    }


    function isAdmin(address _address) internal view returns (bool) {
        return (adminAddress != address(0) && _address == adminAddress);
    }


    function isOps(address _address) internal view returns (bool) {
        return (opsAddress != address(0) && _address == opsAddress);
    }


    function isOwnerOrOps(address _address) internal view returns (bool) {
        return (isOwner(_address) || isOps(_address));
    }


    // Owner and Admin can change the admin address. Address can also be set to 0 to 'disable' it.
    function setAdminAddress(address _adminAddress) external onlyOwnerOrAdmin returns (bool) {
        require(_adminAddress != owner);
        require(_adminAddress != address(this));
        require(!isOps(_adminAddress));

        adminAddress = _adminAddress;

        emit AdminAddressChanged(_adminAddress);

        return true;
    }


    // Owner and Admin can change the operations address. Address can also be set to 0 to 'disable' it.
    function setOpsAddress(address _opsAddress) external onlyOwnerOrAdmin returns (bool) {
        require(_opsAddress != owner);
        require(_opsAddress != address(this));
        require(!isAdmin(_opsAddress));

        opsAddress = _opsAddress;

        emit OpsAddressChanged(_opsAddress);

        return true;
    }
}



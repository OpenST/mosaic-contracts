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
// Common: Basic Ownership Implementation
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title Owned contract.
 *
 *  @notice Implements basic ownership with 2-step transfers.
 */
contract Owned {

    /** Events */
    
    event OwnershipTransferInitiated(address indexed _proposedOwner);
    event OwnershipTransferCompleted(address indexed _newOwner);

    /** Storage */

    address public owner;
    address public proposedOwner;

    /**
     *  @notice Contract constructor.
     *
     *  @dev Sets caller to owner.
     */
    constructor() public {
        owner = msg.sender;
    }

    /** Modifiers */

    /**
     *  @notice Modifier onlyOwner.
     *
     *  @dev Checks if called by Owner to proceed.
     */
    modifier onlyOwner() {
        require(isOwner(msg.sender));
        _;
    }

    /** Internal Functions */

    /**
     *  @notice Internal view function isOwner.
     *
     *  @param _address Address to check.
     *
     *  @return bool True if Owner's address, false otherwise.
     */
    function isOwner(address _address) internal view returns (bool) {
        return (_address == owner);
    }

    /** Public Functions */

    /**
     *  @notice Public function initiateOwnershipTransfer.
     *
     *  @dev Sets _proposedOwner address to proposedOwner.
     *
     *  @param _proposedOwner Address of new proposed owner.
     *
     *  @return bool True if initiating ownership transfer is successful, false otherwise.
     */
    function initiateOwnershipTransfer(address _proposedOwner) public onlyOwner returns (bool) {
        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        return true;
    }

    /**
     *  @notice Public function completeOwnershipTransfer.
     *
     *  @dev Only callable by proposed Owner, sets caller to Owner 
     *       and proposedOwner to 0 address.
     *
     *  @return bool True if complete ownership transfer is successful, false otherwise.
     */
    function completeOwnershipTransfer() public returns (bool) {
        require(msg.sender == proposedOwner);

        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(owner);

        return true;
    }
}



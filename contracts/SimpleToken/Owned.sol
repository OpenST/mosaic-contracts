pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Basic Ownership Implementation
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

/**
 *  @title Owned contract
 *
 *  @notice Implements basic ownership with 2-step transfers.
 */
contract Owned {

    address public owner;
    address public proposedOwner;

    event OwnershipTransferInitiated(address indexed _proposedOwner);
    event OwnershipTransferCompleted(address indexed _newOwner);

    /**
     *  @notice Contract constructor
     *
     *  @dev sets constructor caller to owner
     */
    constructor() public {
        owner = msg.sender;
    }

    /**
     *  @notice modifier onlyOwner
     *
     *  @dev checks if modifier caller isOwner
     */
    modifier onlyOwner() {
        require(isOwner(msg.sender));
        _;
    }

    /**
     *  @notice internal view function isOwner
     *
     *  @param _address address to be checked
     *
     *  @return bool true if address passed is owner address, false otherwise
     */
    function isOwner(address _address) internal view returns (bool) {
        return (_address == owner);
    }

    /**
     *  @notice public function initiateOwnershipTransfer
     *
     *  @dev sets _proposedOwner as proposedOwner
     *
     *  @param _proposedOwner address of proposed owner
     *
     *  @return bool true if ownership transfer is successful, false otherwise
     */
    function initiateOwnershipTransfer(address _proposedOwner) public onlyOwner returns (bool) {
        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        return true;
    }

    /**
     *  @notice public function completeOwnershipTransfer
     *
     *  @dev only callable by proposedOwner, sets function caller as Owner 
     *       and proposedOwner to 0 address.
     *
     *  @return bool true if complete ownership transfer is successful, false otherwise
     */
    function completeOwnershipTransfer() public returns (bool) {
        require(msg.sender == proposedOwner);

        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(owner);

        return true;
    }
}



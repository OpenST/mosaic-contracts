pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Basic Ownership Implementation
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


//
// Implements basic ownership with 2-step transfers.
//
contract Owned {

    address public owner;
    address public proposedOwner;

    event OwnershipTransferInitiated(address indexed _proposedOwner);
    event OwnershipTransferCompleted(address indexed _newOwner);


    constructor() public {
        owner = msg.sender;
    }


    modifier onlyOwner() {
        require(isOwner(msg.sender));
        _;
    }


    function isOwner(address _address) internal view returns (bool) {
        return (_address == owner);
    }


    function initiateOwnershipTransfer(address _proposedOwner) public onlyOwner returns (bool) {
        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        return true;
    }


    function completeOwnershipTransfer() public returns (bool) {
        require(msg.sender == proposedOwner);

        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(owner);

        return true;
    }
}



pragma solidity ^0.4.0;

contract TestContract {

    event TestEvent();
    event TestEvent1();
    uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
    uint variable2;
    bytes32[] public uuids;

    
    struct RegisteredToken {
        address token;
        address registrar;
    }

    constructor(){

    }

}

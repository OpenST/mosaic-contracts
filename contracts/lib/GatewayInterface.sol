pragma solidity ^0.5.0;

contract GatewayInterface { // make it interface

    function getNonce(address _staker) public returns(uint256);

    function token() public returns(address);

    function baseToken() public returns(address);

    function bounty() public returns(uint256);
    
}
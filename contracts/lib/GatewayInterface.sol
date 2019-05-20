pragma solidity ^0.5.0;

interface GatewayInterface {

    function getNonce(address _staker) external returns(uint256);

    function token() external returns(address);

    function baseToken() external returns(address);

    function bounty() external returns(uint256);
    
}
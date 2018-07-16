pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Mock Token Contract
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


import "./ERC20Token.sol";
import "./MockTokenConfig.sol";
import "./OpsManaged.sol";

contract MockToken is ERC20Token, MockTokenConfig {
    
    constructor() public
        ERC20Token(TOKEN_SYMBOL, TOKEN_NAME, TOKEN_DECIMALS, TOKENS_MAX)
        { }

    function remove() public onlyOwner {
        selfdestruct(msg.sender);
    }    


}

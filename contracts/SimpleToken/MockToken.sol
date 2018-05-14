pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Mock Token Contract
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


import "./ERC20Token.sol";
import "./SimpleTokenConfig.sol";
import "./OpsManaged.sol";

contract MockToken is ERC20Token, OpsManaged, SimpleTokenConfig {

    bool public finalized;


    // Events
    event Finalized();

    constructor() public
        ERC20Token("MOCK", "Mock Token", TOKEN_DECIMALS, TOKENS_MAX)
        OpsManaged()
        { }

    // Finalize functionality retained because it is expected by platform scripts
    function finalize() external onlyAdmin returns (bool success) {
        require(!finalized);

        finalized = true;

        emit Finalized();

        return true;
    }

    function remove() public onlyOwner {
        selfdestruct(msg.sender);
    }    
}

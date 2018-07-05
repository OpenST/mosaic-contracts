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
import "./SimpleTokenConfig.sol";
import "./OpsManaged.sol";

/**
 *  @title MockToken which implements ERC20Token, OpsManaged and SimpleTokenConfig
 *
 *  @notice initializes an ERC20Token mock with arguments to facilitate testing
 */
contract MockToken is ERC20Token, OpsManaged, SimpleTokenConfig {

    bool public finalized;

    /* Events */
    
    event Finalized();

    /**
     *  @notice Contract constructor
     * 
     *  @dev passes arguments to ERC20Token contract constructor
     */       
    constructor() public
        ERC20Token("MOCK", "Mock Token", TOKEN_DECIMALS, TOKENS_MAX)
        OpsManaged()
        { }

    /**
     *  @notice external function finalize
     *
     *  @return bool true for finalized set to true, false otherwise
     */
    // Finalize functionality retained because it is expected by platform scripts
    function finalize() external onlyAdmin returns (bool success) {
        require(!finalized);

        finalized = true;

        emit Finalized();

        return true;
    }

    /**
     *  @notice public function remove
     *
     *  @dev destroys the current contract, sending its funds to function caller
     */
    function remove() public onlyOwner {
        selfdestruct(msg.sender);
    }    
}

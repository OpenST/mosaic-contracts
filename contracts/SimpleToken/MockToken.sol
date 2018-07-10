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
 *  @title MockToken contract which implements ERC20Token, OpsManaged and SimpleTokenConfig.
 *
 *  @notice Initializes an ERC20Token mock with arguments to facilitate testing.
 */
contract MockToken is ERC20Token, OpsManaged, SimpleTokenConfig {

    /** Events */
    
    event Finalized();

    /** Storage */

    bool public finalized;

    /**
     *  @notice Contract constructor.
     *
     *  @dev Inputs testing parameters to ERC20Token contract constructor.
     */
    constructor() public
        ERC20Token("MOCK", "Mock Token", TOKEN_DECIMALS, TOKENS_MAX)
        OpsManaged()
        { }

    /**
     *  @notice External function finalize.
     *
     *  @dev Only callable by Admin.
     *
     *  @return bool True for finalized set to true, false otherwise.
     */
    // Finalize functionality retained because it is expected by platform scripts
    function finalize() external onlyAdmin returns (bool success) {
        require(!finalized);

        finalized = true;

        emit Finalized();

        return true;
    }

    /**
     *  @notice Public function remove.
     *
     *  @dev Only callable by Owner. Destroys the current contract, 
     *       sending its funds to function caller's address.
     */
    function remove() public onlyOwner {
        selfdestruct(msg.sender);
    }
}

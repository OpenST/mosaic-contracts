pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Simple Token Contract
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


import "./ERC20Token.sol";
import "./SimpleTokenConfig.sol";
import "./OpsManaged.sol";


//
// SimpleToken is a standard ERC20 token with some additional functionality:
// - It has a concept of finalize
// - Before finalize, nobody can transfer tokens except:
//     - Owner and operations can transfer tokens
//     - Anybody can send back tokens to owner
// - After finalize, no restrictions on token transfers
//

//
// Permissions, according to the ST key management specification.
//
//                                    Owner    Admin   Ops
// transfer (before finalize)           x               x
// transferForm (before finalize)       x               x
// finalize                                      x
//

/**
 *  @title SimpleToken contract which implements ERC20Token, OpsManaged, SimpleTokenConfig.
 *
 *  @notice Implments ERC20Token with added functionality.
 */
contract SimpleToken is ERC20Token, OpsManaged, SimpleTokenConfig {

    /** Events */

    event Burnt(address indexed _from, uint256 _amount);
    event Finalized();

    /** Storage */
    
    bool public finalized;

    /**
     *  @notice Contract constructor.
     *
     *  @dev Sets finalized to false.
     */
    constructor() public
        ERC20Token(TOKEN_SYMBOL, TOKEN_NAME, TOKEN_DECIMALS, TOKENS_MAX)
        OpsManaged()
    {
        finalized = false;
    }

    /**
     *  @notice Public function transfer.
     *
     *  @dev Fires the transfer event, throws if, _from account does not have enough
     *       tokens to spend. Implementation of the standard transfer method that takes 
     *       into account the finalize flag.
     *
     *  @param _to Address to which tokens are transferred.
     *  @param _value Amount of tokens to be transferred.
     *
     *  @return bool True for a successful transfer, false otherwise.
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        checkTransferAllowed(msg.sender, _to);

        return super.transfer(_to, _value);
    }

    /**
     *  @notice Public function transferFrom.
     *
     *  @dev Allows a contract to transfer tokens on behalf of _from address to _to address,
     *       the function caller has to be pre-authorized for multiple transfers up to the 
     *       total of _value amount by the _from address. Implementation of the standard 
     *       transferFrom method that takes into account the finalize flag.
     *
     *  @param _from Address from which tokens are transferred.
     *  @param _to Address to which tokens are transferred.
     *  @param _value Amount of tokens transferred.
     *
     *  @return bool True for a successful transfer, false otherwise.
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        checkTransferAllowed(msg.sender, _to);

        return super.transferFrom(_from, _to, _value);
    }

    /**
     *  @notice Private view function checkTransferAllowed.
     *
     *  @dev Checks if _sender address is Owner or Ops, or if _to address is Owner, throws otherwise.
     *
     *  @param _sender Address of the sender.
     *  @param _to Address to check, if transfer is allowed to.
     */
    function checkTransferAllowed(address _sender, address _to) private view {
        if (finalized) {
            // Everybody should be ok to transfer once the token is finalized.
            return;
        }

        // Owner and Ops are allowed to transfer tokens before the sale is finalized.
        // This allows the tokens to move from the TokenSale contract to a beneficiary.
        // We also allow someone to send tokens back to the owner. This is useful among other
        // cases, for the Trustee to transfer unlocked tokens back to the owner (reclaimTokens).
        require(isOwnerOrOps(_sender) || _to == owner);
    }

    /**
     *  @notice Public function burn.
     *
     *  @dev Implements a burn function to permit msg.sender to reduce its balance,
     *       which also reduces tokenTotalSupply.
     *
     *  @param _value Amount of tokens to burn.
     *
     *  @return True if burn is successful, false otherwise.
     */
    function burn(uint256 _value) public returns (bool success) {
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        tokenTotalSupply = tokenTotalSupply.sub(_value);

        emit Burnt(msg.sender, _value);

        return true;
    }

    /**
     *  @notice External function onlyAdmin.
     *
     *  @dev Only callable by Admin. Finalize method marks the point where 
     *       token transfers are finally allowed for everybody.
     *
     *  @return True if finalized is set to true, false otherwise.
     */    
    function finalize() external onlyAdmin returns (bool success) {
        require(!finalized);

        finalized = true;

        emit Finalized();

        return true;
    }
}

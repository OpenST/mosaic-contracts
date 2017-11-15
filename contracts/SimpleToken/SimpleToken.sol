pragma solidity ^0.4.17;

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

contract SimpleToken is ERC20Token, OpsManaged, SimpleTokenConfig {

    bool public finalized;


    // Events
    event Burnt(address indexed _from, uint256 _amount);
    event Finalized();


    function SimpleToken() public
        ERC20Token(TOKEN_SYMBOL, TOKEN_NAME, TOKEN_DECIMALS, TOKENS_MAX)
        OpsManaged()
    {
        finalized = false;
    }


    // Implementation of the standard transfer method that takes into account the finalize flag.
    function transfer(address _to, uint256 _value) public returns (bool success) {
        checkTransferAllowed(msg.sender, _to);

        return super.transfer(_to, _value);
    }


    // Implementation of the standard transferFrom method that takes into account the finalize flag.
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        checkTransferAllowed(msg.sender, _to);

        return super.transferFrom(_from, _to, _value);
    }


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

    // Implement a burn function to permit msg.sender to reduce its balance
    // which also reduces tokenTotalSupply
    function burn(uint256 _value) public returns (bool success) {
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        tokenTotalSupply = tokenTotalSupply.sub(_value);

        Burnt(msg.sender, _value);

        return true;
    }


    // Finalize method marks the point where token transfers are finally allowed for everybody.
    function finalize() external onlyAdmin returns (bool success) {
        require(!finalized);

        finalized = true;

        Finalized();

        return true;
    }
}

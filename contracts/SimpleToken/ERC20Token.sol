pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Standard ERC20 Token Implementation
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

import "./ERC20Interface.sol";
import "./Owned.sol";
import "./SafeMath.sol";

/**
 *  @title ERC20Token which implements ERC20Interface and Owned
 *
 *  @notice Standard ERC20 implementation, with ownership
 */
contract ERC20Token is ERC20Interface, Owned {

    using SafeMath for uint256;

    string  private tokenName;
    string  private tokenSymbol;
    uint8   private tokenDecimals;
    uint256 internal tokenTotalSupply;

    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;

    /**
     *  @notice Contract constructor
     *
     *  @param _symbol symbol of the token
     *  @param _name name of the token 
     *  @param _decimals number of decimal places the token uses
     *  @param _totalSupply total token supply
     */    
    constructor(string _symbol, string _name, uint8 _decimals, uint256 _totalSupply) public
        Owned()
    {
        tokenSymbol      = _symbol;
        tokenName        = _name;
        tokenDecimals    = _decimals;
        tokenTotalSupply = _totalSupply;
        balances[owner]  = _totalSupply;

        // According to the ERC20 standard, a token contract which creates new tokens should trigger
        // a Transfer event and transfers of 0 values must also fire the event.
        emit Transfer(0x0, owner, _totalSupply);
    }

    /**
     *  @notice public view function name
     *
     *  @return string Name of the token
     */
    function name() public view returns (string) {
        return tokenName;
    }

    /**
     *  @notice public view function symbol
     *
     *  @return string Symbol of the token
     */
    function symbol() public view returns (string) {
        return tokenSymbol;
    }

    /**
     *  @notice public view function decimals
     *
     *  @return uint8 number of decimals the token uses
     */
    function decimals() public view returns (uint8) {
        return tokenDecimals;
    }

    /**
     *  @notice public view function totalSupply
     *
     *  @return uint256 Total supply of the token
     */
    function totalSupply() public view returns (uint256) {
        return tokenTotalSupply;
    }

    /**
     *  @notice public view function balanceOf
     *
     *  @param _owner account address of the owner 
     *
     *  @return uint256 account balance of the owner address
     */
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    /**
     *  @notice public view function allowance
     *
     *  @param _owner account address of the owner 
     *  @param _spender account address of the spender
     *
     *  @return uint256 remaining allowance for spender to spend from owners account
     */
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    /**
     *  @notice public function transfer
     *
     *  @dev fires the transfer event, throws if _from account does not have enough
     *       tokens to spend.
     *
     *  @param _to account address to which token(s) are to be transferred  
     *  @param _value amount value of token(s) to be transferred
     *
     *  @return bool true for a successful transfer, false otherwise
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // According to the EIP20 spec, "transfers of 0 values MUST be treated as normal
        // transfers and fire the Transfer event".
        // Also, should throw if not enough balance. This is taken care of by SafeMath.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    /**
     *  @notice public function transferFrom
     *
     *  @dev allows a contract to transfer tokens on behalf of _from account address to _to account address, 
     *       the function caller has to be pre-authorized for transfers up to the total of _value amount 
     *       by the _from account address
     *
     *  @param _from account address from which token(s) are to be transferred
     *  @param _to account address to which token(s) are to be transferred  
     *  @param _value amount value of the token(s) to be transferred
     *
     *  @return bool true for a successful transfer, false otherwise
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(_from, _to, _value);

        return true;
    }

    /**
     *  @notice public function approve
     *
     *  @param _spender account address to be authorized to spend from the account address 
     *         of the function caller 
     *  @param _value amount value upto which spender is authorized to spend
     *
     *  @return bool true for a successful approval, false otherwise
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {

        allowed[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

}

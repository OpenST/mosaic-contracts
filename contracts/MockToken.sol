pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Mock Token Contract
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


import "./EIP20Interface.sol";
import "./MockTokenConfig.sol";
import "./OpsManaged.sol";
import "./SafeMath.sol";

contract MockToken is EIP20Interface, MockTokenConfig, OpsManaged {

	using SafeMath for uint256;

	string  private tokenName;
	string  private tokenSymbol;
	uint8   private tokenDecimals;
	uint256 internal tokenTotalSupply;

	mapping(address => uint256) balances;
	mapping(address => mapping (address => uint256)) allowed;

    // Events
    event Burnt(address indexed _from, uint256 _amount);
    
	constructor() public
		OpsManaged()
	{
		tokenSymbol      = TOKEN_SYMBOL;
		tokenName        = TOKEN_NAME;
		tokenDecimals    = TOKEN_DECIMALS;
		tokenTotalSupply = TOKENS_MAX;
		balances[owner]  = TOKENS_MAX;
		
		// According to the ERC20 standard, a token contract which creates new tokens should trigger
		// a Transfer event and transfers of 0 values must also fire the event.
		emit Transfer(0x0, owner, TOKENS_MAX);
	}

	function name() public view returns (string) {
		return tokenName;
	}


	function symbol() public view returns (string) {
		return tokenSymbol;
	}


	function decimals() public view returns (uint8) {
		return tokenDecimals;
	}


	function totalSupply() public view returns (uint256) {
		return tokenTotalSupply;
	}


	function balanceOf(address _owner) public view returns (uint256) {
		return balances[_owner];
	}


	function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
		return allowed[_owner][_spender];
	}


	function transfer(address _to, uint256 _value) public returns (bool success) {
		// According to the EIP20 spec, "transfers of 0 values MUST be treated as normal
		// transfers and fire the Transfer event".
		// Also, should throw if not enough balance. This is taken care of by SafeMath.
		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);

		emit Transfer(msg.sender, _to, _value);

		return true;
	}


	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		balances[_from] = balances[_from].sub(_value);
		allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);

		emit Transfer(_from, _to, _value);

		return true;
	}


	function approve(address _spender, uint256 _value) public returns (bool success) {

		allowed[msg.sender][_spender] = _value;

		emit Approval(msg.sender, _spender, _value);

		return true;
	}

    // Implement a burn function to permit msg.sender to reduce its balance
    // which also reduces tokenTotalSupply
    function burn(uint256 _value) public returns (bool success) {
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        tokenTotalSupply = tokenTotalSupply.sub(_value);

        emit Burnt(msg.sender, _value);

        return true;
    }

	function remove() public onlyOwner {
		selfdestruct(msg.sender);
	}
}
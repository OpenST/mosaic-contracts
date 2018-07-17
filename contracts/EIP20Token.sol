pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// 
// ----------------------------------------------------------------------------
// Utility chain: EIP20 Token Implementation
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20Interface.sol";
import "./SafeMath.sol";

/**
 *  @title EIP20Token contract which implements EIP20Interface.
 *
 *  @notice Implements EIP20 token.
 */
contract EIP20Token is EIP20Interface {
    using SafeMath for uint256;

    string private tokenName;
    string private tokenSymbol;
    uint8  private tokenDecimals;

    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;

    /**
     *  @notice Contract constructor.
     *
     *  @param _symbol Symbol of the token.
     *  @param _name Name of the token.
     *  @param _decimals Decimal places of the token.
     */
    constructor(string _symbol, string _name, uint8 _decimals) public
    {
        tokenSymbol      = _symbol;
        tokenName        = _name;
        tokenDecimals    = _decimals;
    }

    /**
     *  @notice Public view function name.
     *
     *  @return string Name of the token.
     */
    function name() public view returns (string) {
        return tokenName;
    }

    /**
     *  @notice Public view function symbol.
     *
     *  @return string Symbol of the token.
     */
    function symbol() public view returns (string) {
        return tokenSymbol;
    }

    /**
     *  @notice Public view function decimals.
     *
     *  @return uint8 Decimal places of the token.
     */
    function decimals() public view returns (uint8) {
        return tokenDecimals;
    }

    /**
     *  @notice Public view function balanceOf.
     *
     *  @param _owner Address of the owner account.
     *
     *  @return uint256 Account balance of the owner account.
     */
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    /**
     *  @notice Public view function allowance.
     *
     *  @param _owner Address of the owner account.
     *  @param _spender Address of the spender account.
     *
     *  @return uint256 Remaining allowance for the spender to spend from owner's account.
     */
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    /**
     *  @notice Public function transfer.
     *
     *  @dev Fires the transfer event, throws if, _from account does not have enough
     *       tokens to spend.
     *
     *  @param _to Address to which tokens are transferred.
     *  @param _value Amount of tokens to be transferred.
     *
     *  @return bool True for a successful transfer, false otherwise.
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
     *  @notice Public function transferFrom.
     *
     *  @dev Allows a contract to transfer tokens on behalf of _from address to _to address,
     *       the function caller has to be pre-authorized for multiple transfers up to the 
     *       total of _value amount by the _from address.
     *
     *  @param _from Address from which tokens are transferred.
     *  @param _to Address to which tokens are transferred.
     *  @param _value Amount of tokens transferred.
     *
     *  @return bool True for a successful transfer, false otherwise.
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(_from, _to, _value);

        return true;
    }

    /**
     *  @notice Public function approve.
     *
     *  @dev Allows _spender address to withdraw from function caller's account, multiple times up 
     *       to the _value amount, if this function is called again 
     *       it overwrites the current allowance with _value.
     *
     *  @param _spender Address authorized to spend from the function caller's address.
     *  @param _value Amount up to which spender is authorized to spend.
     *
     *  @return bool True for a successful approval, false otherwise.
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {

        allowed[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    /**
     *  @notice Internal function claimEIP20.
     *
     *  @dev Subtracts _amount of tokens from EIP20Token contract balance,
     *       adds _amount to beneficiary's balance.
     *
     *  @param _beneficiary Address of tokens beneificary.
     *  @param _amount Amount of tokens claimed for beneficiary.
     *
     *  @return bool True if claim of tokens for beneficiary address is successful, 
     *          false otherwise.
     */
    function claimEIP20(address _beneficiary, uint256 _amount) internal returns (bool success) {
        // claimable tokens are minted in the contract address to be pulled on claim
        balances[address(this)] = balances[address(this)].sub(_amount);
        balances[_beneficiary] = balances[_beneficiary].add(_amount);

        emit Transfer(address(this), _beneficiary, _amount);

        return true;
    }

    /**
     *  @notice Internal function mintEIP20.
     *
     *  @dev Adds _amount tokens to EIP20Token contract balance.
     *
     *  @param _amount Amount of tokens to mint.
     *
     *  @return bool True if mint is successful, false otherwise.
     */
    function mintEIP20(uint256 _amount) internal returns (bool /* success */) {
        // mint EIP20 tokens in contract address for them to be claimed
        balances[address(this)] = balances[address(this)].add(_amount);
    
        return true;
    }

    /**
     *  @notice Internal function burnEIP20.
     *
     *  @dev Subtracts _amount tokens from the balance of function caller's address.  
     *
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if burn is successful, false otherwise.
     */
    function burnEIP20(uint256 _amount) internal returns (bool /* success */) {
        balances[msg.sender] = balances[msg.sender].sub(_amount);

        return true;
    }
}

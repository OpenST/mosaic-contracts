pragma solidity ^0.4.17;

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
// EIP20 Token Implementation
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20Interface.sol";
import "./SafeMath.sol";

/**
   @title EIP20Token
   @notice Implements EIP20 token
*/
contract EIP20Token is EIP20Interface {
    using SafeMath for uint256;

    string private tokenName;
    string private tokenSymbol;
    uint8  private tokenDecimals;

    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;


    function EIP20Token(string _symbol, string _name, uint8 _decimals) public
    {
        tokenSymbol      = _symbol;
        tokenName        = _name;
        tokenDecimals    = _decimals;
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

        Transfer(msg.sender, _to, _value);

        return true;
    }


    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        Transfer(_from, _to, _value);

        return true;
    }


    function approve(address _spender, uint256 _value) public returns (bool success) {

        allowed[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);

        return true;
    }


    function claimEIP20(address _beneficiary, uint256 _amount) internal returns (bool success) {
        // claimable tokens are minted in the contract address to be pulled on claim
        balances[address(this)] = balances[address(this)].sub(_amount);
        balances[_beneficiary] = balances[_beneficiary].add(_amount);

        Transfer(address(this), _beneficiary, _amount);

        return true;
    }


    function mintEIP20(uint256 _amount) internal returns (bool /* success */) {
        // mint EIP20 tokens in contract address for them to be claimed
        balances[address(this)] = balances[address(this)].add(_amount);
    
        return true;
    }
}

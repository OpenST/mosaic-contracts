pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../lib/EIP20Interface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title EIP20Token contract.
 *
 * @notice EIP20Token implements EIP20Interface.
 */
contract EIP20Token is EIP20Interface {

    using SafeMath for uint256;

    /** Name of the token. */
    string private tokenName;

    /** Symbol of the token. */
    string private tokenSymbol;

    /** Decimals used by the token. */
    uint8  private tokenDecimals;

    /** Total supply of the token. */
    uint256 internal totalTokenSupply;

    /** Stores the token balance of the accounts. */
    mapping(address => uint256) balances;

    /** Stores the authorization information. */
    mapping(address => mapping (address => uint256)) allowed;


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @param _symbol Symbol of the token.
     * @param _name Name of the token.
     * @param _decimals Decimal places of the token.
     */
    constructor(
        string memory _symbol,
        string memory _name,
        uint8 _decimals
    )
        public
    {
        tokenSymbol = _symbol;
        tokenName = _name;
        tokenDecimals = _decimals;
        totalTokenSupply = 0;
    }


    /* Public functions. */

    /**
     * @notice Public function to get the name of the token.
     *
     * @return tokenName_ Name of the token.
     */
    function name() public view returns (string memory tokenName_) {
        tokenName_ = tokenName;
    }

    /**
     * @notice Public function to get the symbol of the token.
     *
     * @return tokenSymbol_ Symbol of the token.
     */
    function symbol() public view returns (string memory tokenSymbol_) {
        tokenSymbol_ = tokenSymbol;
    }

    /**
     * @notice Public function to get the decimals of the token.
     *
     * @return tokenDecimals Decimals of the token.
     */
    function decimals() public view returns (uint8 tokenDecimals_) {
        tokenDecimals_ = tokenDecimals;
    }

    /**
     * @notice Get the balance of an account.
     *
     * @param _owner Address of the owner account.
     *
     * @return balance_ Account balance of the owner account.
     */
    function balanceOf(address _owner) public view returns (uint256 balance_) {
        balance_ = balances[_owner];
    }

    /**
     * @notice Public function to get the total supply of the tokens.
     *
     * @dev Get totalTokenSupply as view so that child cannot edit.
     *
     * @return totalTokenSupply_ Total token supply.
     */
    function totalSupply()
        public
        view
        returns (uint256 totalTokenSupply_)
    {
        totalTokenSupply_ = totalTokenSupply;
    }


    /**
     * @notice Public function to get the allowance.
     *
     * @param _owner Address of the owner account.
     * @param _spender Address of the spender account.
     *
     * @return allowance_ Remaining allowance for the spender to spend from
     *                    owner's account.
     */
    function allowance(
        address _owner,
        address _spender
    )
        public
        view
        returns (uint256 allowance_)
    {
        allowance_ = allowed[_owner][_spender];
    }

    /**
     * @notice Public function to transfer the token.
     *
     * @dev Fires the transfer event, throws if, _from account does not have
     *      enough tokens to spend.
     *
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens to be transferred.
     *
     * @return success_ `true` for a successful transfer, `false` otherwise.
     */
    function transfer(
        address _to,
        uint256 _value
    )
        public
        returns (bool success_)
    {
        success_ = transferBalance(msg.sender, _to, _value);
    }

    /**
     * @notice Public function transferFrom.
     *
     * @dev Allows a contract to transfer tokens on behalf of _from address
     *      to _to address, the function caller has to be pre-authorized for
     *      multiple transfers up to the total of _value amount by the _from
     *      address.
     *
     * @param _from Address from which tokens are transferred.
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens transferred.
     *
     * @return success_ `true` for a successful transfer, `false` otherwise.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        returns (bool success_)
    {
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        success_ = transferBalance(_from, _to, _value);
    }

    /**
     * @notice Public function to approve an account for transfer.
     *
     * @dev Allows _spender address to withdraw from function caller's account,
     *      multiple times up to the _value amount, if this function is called
     *      again it overwrites the current allowance with _value.
     *
     * @param _spender Address authorized to spend from the function caller's
     *                  address.
     * @param _value Amount up to which spender is authorized to spend.
     *
     * @return bool `true` for a successful approval, `false` otherwise.
     */
    function approve(
        address _spender,
        uint256 _value
    )
        public
        returns (bool success_)
    {

        allowed[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        success_ = true;
    }


    /* Internal functions. */

    /**
     * @notice Internal function to transfer the tokens.
     *
     * @dev This is an internal functions that transfers the token. This
     *      function is called from transfer and transferFrom functions.
     *
     * @param _from Address from which tokens are transferred.
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens transferred.
     *
     * @return success_ `true` for a successful transfer, `false` otherwise.
     */
    function transferBalance(
        address _from,
        address _to,
        uint256 _value
    )
        internal
        returns (bool success_)
    {
        /**
         * According to the EIP20 spec, "transfers of 0 values MUST be treated
         * as normal transfers and fire the Transfer event".
         * Also, should throw if not enough balance. This is taken care of by
         * SafeMath.
         */
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(_from, _to, _value);

        success_ = true;
    }
}

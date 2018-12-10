/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.5.0;

// Copyright 2018 OpenST Ltd.
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

/// Simple Token Prime [OST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the auxiliary
/// chain. The gasprice on auxiliary chains is set in [OST'-Wei/gas] (like
/// Ether pays for gas on Ethereum mainnet) when sending a transaction on
/// the auxiliary chain.

import "../lib/SafeMath.sol";
import "./UtilityToken.sol";
import "./OSTPrimeConfig.sol";


/**
 *  @title OSTPrime contract implements UtilityToken and
 *         OSTPrimeConfig.
 *
 *  @notice A freely tradable equivalent representation of Simple Token [OST]
 *          on Ethereum mainnet on the auxiliary chain.
 *
 *  @dev OSTPrime functions as the base token to pay for gas consumption on the
 *       utility chain.
 */
contract OSTPrime is UtilityToken, OSTPrimeConfig {

    using SafeMath for uint256;

    /** Emitted whenever OST` EIP20 token is converted to OST` base token. */
    event TokenUnwrapped(
        address indexed _account,
        uint256 _amount
    );

    /** Emitted whenever OST` base token is converted to OST` EIP20 token. */
    event TokenWrapped(
        address indexed _account,
        uint256 _amount
    );

    /**
     * set when OST' has received TOKENS_MAX tokens;
     * when uninitialised mint is not allowed
     */
    bool public initialized;


    /**  Modifiers */

    /**
     *  @notice Modifier onlyInitialized.
     *
     *  @dev Checks if initialized is set to True to proceed.
     */
    modifier onlyInitialized() {
        require(
            initialized == true,
            "Contract is not initialized."
        );
        _;
    }


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @dev this contract should be deployed with zero gas.
     *
     * @param _valueToken ERC20 token address in origin chain.
     */
    constructor(address _valueToken)
        public
        UtilityToken(
            TOKEN_SYMBOL,
            TOKEN_NAME,
            TOKEN_DECIMALS,
            _valueToken)
    {

    }


    /* Public functions. */

    /**
     * @notice Public function initialize.
     *
     * @dev it must verify that the genesis exactly specified TOKENS_MAX
     *      so that all base tokens are held by OSTPrime.
     *      On setup of the auxiliary chain the base tokens need to be
     *      transferred in full to OSTPrime for the base tokens to be
     *      minted as OST'.
     *
     * @return success_ `true` if initialize was successful.
     */    
    function initialize()
        public
        payable
        returns (bool success_)
    {
        require(
            initialized == false,
            "Contract is already initialized."
        );

        require(
            msg.value == TOKENS_MAX,
            "Payable amount must be equal to total supply of token."
        );

        initialized = true;

        success_ = true;
    }

    /**
     * @notice convert the OST' EIP-20 token to OST` base token.
     *
     * @param _amount Amount of EIP-20 to convert to base token.
     *
     * @return success_ `true` if unwrap was successful.
     */
    function unwrap(
        uint256 _amount
    )
        public
        onlyInitialized
        returns (bool success_)
    {
        require(
            _amount > 0,
            "Amount should not be zero."
        );

        require(
            _amount <= balances[msg.sender],
            "Insufficient balance."
        );

        assert(address(this).balance >= _amount);


        balances[msg.sender] = balances[msg.sender].sub(_amount);
        balances[address(this)] = balances[address(this)].add(_amount);
        msg.sender.transfer(_amount);

        emit Transfer(msg.sender, address(this), _amount);
        emit TokenUnwrapped(msg.sender, _amount);

        success_ = true;
    }

    /**
     * @notice convert OST` base token to OST EIP-20 token.
     *
     * @return success_ `true` if claim was successfully progressed.
     */
    function wrap()
        public
        onlyInitialized
        payable
        returns (bool success_)
    {
        require(
            msg.value > 0,
            "Payable amount should not be zero."
        );

        require(
            address(msg.sender).balance >= msg.value,
            "Available balance is less than payable amount."
        );

        require(
            balances[address(this)] >= msg.value,
            "Insufficient EIP-20 token balance."
        );

        balances[address(this)] = balances[address(this)].sub(msg.value);
        balances[msg.sender] = balances[msg.sender].add(msg.value);

        emit Transfer(address(this), msg.sender, msg.value);
        emit TokenWrapped(msg.sender, msg.value);

        success_ = true;
    }

}

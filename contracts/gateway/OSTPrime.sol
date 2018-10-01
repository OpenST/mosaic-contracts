/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.23;

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
// Utility chain: OSTPrime
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/// Simple Token Prime [OST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the utility
/// chain. The gasprice on utility chains is set in [ST'-Wei/gas] (like
/// Ether pays for gas on Ethereum mainnet) when sending a transaction on
/// the open utility chain.

import "./SafeMath.sol";

/** utility chain contracts */
import "./UtilityToken.sol";
import "./OSTPrimeConfig.sol";


/**
 *  @title OSTPrime contract which implements UtilityToken and
 *         OSTPrimeConfig.
 *
 *  @notice A freely tradable equivalent representation of Simple Token [ST]
 *          on Ethereum mainnet on the utility chain.
 *
 *  @dev OSTPrime functions as the base token to pay for gas consumption on the utility chain
 *       It is not an EIP20 token, but functions as the genesis guardian
 *       of the finite amount of base tokens on the utility chain.
 */
contract OSTPrime is UtilityToken, OSTPrimeConfig {
    using SafeMath for uint256;

    event Claim(
        address indexed _beneficiary,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    event Redeem(
        address indexed _redeemer,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /** set when ST' has received TOKENS_MAX tokens; when uninitialised minting is not allowed */
    bool private initialized;

    /**  Modifiers */

    /**
     *  @notice Modifier onlyInitialized.
     *
     *  @dev Checks if initialized is set to True to proceed.
     */
    modifier onlyInitialized() {
        require(initialized);
        _;
    }

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @param _valueToken ERC20 token address in origin chain
     */
    constructor(address _valueToken)
        public
        UtilityToken(
            TOKEN_SYMBOL,
            TOKEN_NAME,
            TOKEN_DECIMALS,
            _valueToken
        )
    {

    }

    /**
     *  @notice Public function initialize. 
     *
     *  @dev Before the registrar registers a core on the value chain
     *       it must verify that the genesis exactly specified TOKENS_MAX
     *       so that all base tokens are held by OSTPrime.
     *       On setup of the utility chain the base tokens need to be transfered 
     *       in full to OSTPrime for the base tokens to be minted as ST'
     */    
    function initialize()
        public
        payable
    {
        require(msg.value == TOKENS_MAX);
        initialized = true;
    }



    /// @dev transfer full claim to beneficiary
    ///      claim can be called publicly as the beneficiary
    ///      and amount are set, and this allows for reduced
    ///      steps on the user experience to complete the claim
    ///      automatically.
    /// @notice for first stake of ST' the gas price by one validator
    ///         has to be zero to deploy the contracts and accept the very
    ///         first staking of ST for ST' and its protocol executions.
    function claim(
        uint256 _amount
    )
        public
        onlyInitialized
        returns (bool /* success */)
    {
        require(
            _amount <= balances[msg.sender],
            "Insufficient balance"
        );

        assert(address(this).balance >= _amount);
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        balances[address(this)] = balances[address(this)].add(_amount);

        // transfer throws if insufficient funds
        msg.sender.transfer(_amount);

        emit Transfer(msg.sender, address(this), _amount);

        emit Claim(msg.sender, _amount, totalTokenSupply, address(this));

        return true;
    }

    function redeem(uint256 _amount)
        public
        onlyInitialized
        payable
        returns (bool /** success */)
    {
        require(msg.value == _amount);
        assert(address(this).balance >= _amount);

        balances[msg.sender] = balances[msg.sender].add(_amount);
        balances[address(this)] = balances[address(this)].sub(_amount);

        emit Transfer(address(this), msg.sender, _amount);

        emit Redeem(msg.sender, _amount, totalTokenSupply, address(this));


    }
}
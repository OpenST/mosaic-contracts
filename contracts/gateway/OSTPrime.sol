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
// Auxiliary chain: OSTPrime
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/// Simple Token Prime [OST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the utility
/// chain. The gasprice on utility chains is set in [ST'-Wei/gas] (like
/// Ether pays for gas on Ethereum mainnet) when sending a transaction on
/// the auxiliary chain.

import "../lib/SafeMath.sol";
import "./UtilityToken.sol";
import "./OSTPrimeConfig.sol";


/**
 *  @title OSTPrime contract which implements UtilityToken and
 *         OSTPrimeConfig.
 *
 *  @notice A freely tradable equivalent representation of Simple Token [ST]
 *          on Ethereum mainnet on the utility chain.
 *
 *  @dev OSTPrime functions as the base token to pay for gas consumption on the
 *       utility chain.
 */
contract OSTPrime is UtilityToken, OSTPrimeConfig {

    using SafeMath for uint256;

    /** Emitted whenever OSTPrime base token is claimed. */
    event Claim(
        address indexed _beneficiary,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /** Emitted whenever basetoken is converted to OSTPrime */
    event Redeem(
        address indexed _redeemer,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /**
     * set when OST' has received TOKENS_MAX tokens;
     * when uninitialised minting is not allowed
     */
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
     * @notice Contract constructor.
     *
     * @dev this contract should be deployed with zero gas
     *
     * @param _valueToken ERC20 token address in origin chain
     */
    constructor(address _valueToken)
        public
        UtilityToken(TOKEN_SYMBOL, TOKEN_NAME, TOKEN_DECIMALS, _valueToken)
    {

    }

    /**
     * @notice Public function initialize.
     *
     * @dev it must verify that the genesis exactly specified TOKENS_MAX
     *      so that all base tokens are held by OSTPrime.
     *      On setup of the auxiliary chain the base tokens need to be
     *      transferred in full to OSTPrime for the base tokens to be
     *      minted as OST'
     */    
    function initialize()
        public
        payable
    {
        require(msg.value == TOKENS_MAX);
        initialized = true;
    }

    /**
     * @notice convert the OST utility token to base token
     *
     * @param _amount Amount of basetoken
     *
     * @return `true` if claim was successfully progressed
     */
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

        transfer(address(this),_amount);
        msg.sender.transfer(_amount);

        emit Claim(msg.sender, _amount, totalTokenSupply, address(this));

        return true;
    }

    /**
     * @notice convert the base token to OST utility token
     *
     * @param _amount Amount of utility token
     *
     * @return `true` if claim was successfully progressed
     */
    function redeem(uint256 _amount)
        public
        onlyInitialized
        payable
        returns (bool /** success */)
    {
        require(msg.value == _amount);
        assert(address(this).balance >= _amount);

        allowed[address(this)][msg.sender] = _amount;
        transferFrom(address(this), msg.sender, _amount);

        emit Redeem(msg.sender, _amount, totalTokenSupply, address(this));

    }
}

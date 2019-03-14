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

/*
 * Simple Token Prime [OST'] is equivalently staked for with Simple Token
 * on the value chain and is the base token that pays for gas on the auxiliary
 * chain. The gasprice on auxiliary chains is set in [OST'-Wei/gas] (like
 * Ether pays for gas on Ethereum mainnet) when sending a transaction on
 * the auxiliary chain.
 */
import "./OSTPrimeConfig.sol";
import "./UtilityToken.sol";
import "../lib/MutexAddress.sol";
import "../lib/OrganizationInterface.sol";
import "../lib/SafeMath.sol";

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
contract OSTPrime is UtilityToken, OSTPrimeConfig, MutexAddress {

    /* Usings */

    using SafeMath for uint256;

    /** Emitted whenever OST Prime token is converted to OST Prime base token. */
    event TokenUnwrapped(
        address indexed _account,
        uint256 _amount
    );

    /** Emitted whenever OST Prime base token is converted to OST Prime token. */
    event TokenWrapped(
        address indexed _account,
        uint256 _amount
    );

    /**
     * Set when OST Prime has received TOKENS_MAX tokens;
     * when uninitialized wrap and unwrap is not allowed.
     */
    bool public initialized;


    /*  Modifiers */

    /**
     *  @notice Modifier onlyInitialized.
     *
     *  @dev Checks if initialized is set to `true` to proceed.
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
     * @dev This contract should be deployed with zero gas.
     *
     * @param _valueToken ERC20 token address in origin chain.
     * @param _organization Address of a contract that manages organization.
     */
    constructor(
        EIP20Interface _valueToken,
        OrganizationInterface _organization
    )
        public
        UtilityToken(
            _valueToken,
            TOKEN_SYMBOL,
            TOKEN_NAME,
            TOKEN_DECIMALS,
            _organization
        )
    {}


    /* Public functions. */

    /**
     * @notice Public function initialize.
     *
     * @dev It must verify that the genesis exactly specified TOKENS_MAX
     *      so that all base tokens are held by OSTPrime.
     *      On setup of the auxiliary chain the base tokens need to be
     *      transferred in full to OSTPrime for the base tokens to be
     *      minted as OST Prime.
     *
     * @return success_ `true` if initialize was successful.
     */    
    function initialize()
        external
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


    /* External functions. */

    /**
     * @notice Convert the OST Prime token to OST Prime base token.
     *
     * @param _amount Amount of OST Prime token to convert to base token.
     *
     * @return success_ `true` if unwrap was successful.
     */
    function unwrap(
        uint256 _amount
    )
        external
        onlyInitialized
        returns (bool success_)
    {
        require(
            _amount > 0,
            "Amount must not be zero."
        );

        require(
            _amount <= balances[msg.sender],
            "Insufficient balance."
        );

        /*
         * The OST Prime base token balance of contract should always be
         * greater than the amount if the above conditions are satisfied
         * received payable amount.
         */
        assert(address(this).balance >= _amount);

        transferBalance(msg.sender, address(this), _amount);

        msg.sender.transfer(_amount);

        emit TokenUnwrapped(msg.sender, _amount);

        success_ = true;
    }

    /**
     * @notice Convert OST Prime base token to OST Prime token.
     *
     * @return success_ `true` if claim was successfully progressed.
     */
    function wrap()
        external
        onlyInitialized
        payable
        returns (bool success_)
    {
        uint256 amount = msg.value;
        address account = msg.sender;

        require(
            amount > 0,
            "Payable amount should not be zero."
        );

        /*
         * The OST Prime balance of contract should always be greater than the
         * received payable amount.
         */
        assert(balances[address(this)] >= amount);

        transferBalance(address(this), account, amount);

        emit TokenWrapped(account, amount);

        success_ = true;
    }

    /**
     * @notice This method performs following operations:
     *          - Adds number of OST Prime EIP20 tokens to this contract address.
     *          - Increases the total token supply.
     *          - Transfers base token to the beneficiary address.
     *          It can be called by CoGateway address and when contract is
     *          initialized.
     *
     * @param _account Account address for which the OST Prime balance will be
     *                 increased. This is payable so that base token can be
     *                 transferred to the account.
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if increase supply is successful, false otherwise.
     */
    function increaseSupply(
        address payable _account,
        uint256 _amount
    )
        external
        onlyInitialized
        onlyCoGateway
        returns (bool success_)
    {
        // Acquire lock for msg.sender so that this function can only be
        // executed once in a transaction.
        MutexAddress.acquire(msg.sender);

        success_ = increaseSupplyInternal(address(this), _amount);
        _account.transfer(_amount);

        MutexAddress.release(msg.sender);
    }

    /**
     * @notice Decreases the OST Prime token balance from the msg.sender
     *         address and decreases the total token supply count. Can be
     *         called only when contract is initialized and only by CoGateway
     *         address.
     *
     * @dev The parameters _amount should not be zero. This check is added in
     *      function decreaseSupplyInternal.
     *
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if decrease supply is successful, false otherwise.
     */
    function decreaseSupply(
        uint256 _amount
    )
        external
        onlyInitialized
        onlyCoGateway
        returns (bool success_)
    {
        success_ = decreaseSupplyInternal(_amount);
    }
}

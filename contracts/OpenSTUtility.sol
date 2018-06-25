/* solhint-disable-next-line compiler-fixed */
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
// Utility chain: OpenSTUtility
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./Hasher.sol";
import "./OpsManaged.sol";

// utility chain contracts
import "./STPrime.sol";
import "./STPrimeConfig.sol";
import "./BrandedToken.sol";
import "./UtilityTokenInterface.sol";
import "./ProtocolVersioned.sol";
import "./Core.sol";
import "./MerklePatriciaProof.sol";

/// @title OpenST Utility
contract OpenSTUtility is Hasher, OpsManaged, STPrimeConfig {
    using SafeMath for uint256;

    /*
     *    Events
     */
    event ProposedBrandedToken(address indexed _requester, address indexed _token,
        bytes32 _uuid, string _symbol, string _name, uint256 _conversionRate, uint8 _conversionRateDecimals);

    event RegisteredBrandedToken(address indexed _registrar, address indexed _token,
        bytes32 _uuid, string _symbol, string _name, uint256 _conversionRate,
        uint8 _conversionRateDecimals, address _requester);

    event StakingIntentConfirmed(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
        address _staker, address _beneficiary, uint256 _amountST, uint256 _amountUT, uint256 _expirationHeight,bytes32 blockHeight,bytes32 storageRoot);

    event ProcessedMint(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash, address _token,
        address _staker, address _beneficiary, uint256 _amount, bytes32 _unlockSecret);

    event RevertedMint(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash, address _staker,
        address _beneficiary, uint256 _amountUT);

    event RedemptionIntentDeclared(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
        address _token, address _redeemer, uint256 _nonce, address _beneficiary, uint256 _amount, uint256 _unlockHeight,
        uint256 _chainIdValue);

    event ProcessedRedemption(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash, address _token,
        address _redeemer, address _beneficiary, uint256 _amount, bytes32 _unlockSecret);

    event RevertedRedemption(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
        address _redeemer, address _beneficiary, uint256 _amountUT);


    /*
  *  Constants
  */
    // ~2 weeks, assuming ~15s per block
    uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
    // ~1hour, assuming ~15s per block
    uint256 public constant BLOCKS_TO_WAIT_SHORT = 240;

    /*
     *  Storage
     */

    // storage for staking intent hash of active staking intents
    mapping(bytes32 /* intentHash */ => bytes32) public intents;

    /// store the ongoing mints and redemptions
    mapping(bytes32 /* stakingIntentHash */ => Mint) public mints;
    mapping(bytes32 /* redemptionIntentHash */ => Redemption) public redemptions;
    mapping(bytes32 /* uuid */ => RegisteredToken) public registeredTokens;
    /// name reservation is first come, first serve
    mapping(bytes32 /* hashName */ => address /* requester */) public nameReservation;
    /// symbol reserved for unique API routes
    /// and resolves to address
    mapping(bytes32 /* hashSymbol */ => address /* UtilityToken */) public symbolRoute;
    /// nonce makes the staking process atomic across the two-phased process
    /// and protects against replay attack on (un)staking proofs during the process.
    /// On the value chain nonces need to strictly increase by one; on the utility
    /// chain the nonce need to strictly increase (as one value chain can have multiple
    /// utility chains)
    mapping(address /* (un)staker */ => uint256) internal nonces;

    /// store address of Simple Token Prime
    address public simpleTokenPrime;
    bytes32 public uuidSTPrime;
    /// restrict (for now) to a single value chain
    uint256 public chainIdValue;
    /// chainId of the current utility chain
    uint256 public chainIdUtility;
    address public registrar;

    CoreInterface public core;


    bytes32[] public uuids;
    /// registered branded tokens
    /*
     *  Structures
     */
    struct RegisteredToken {
        UtilityTokenInterface token;
        address registrar;
    }

    struct Mint {
        bytes32 uuid;
        address staker;
        address beneficiary;
        uint256 amount;
        uint256 expirationHeight;
        bytes32 hashLock;
    }

    struct Redemption {
        bytes32 uuid;
        address redeemer;
        uint256 nonce;
        address beneficiary;
        uint256 amountUT;
        uint256 unlockHeight;
        bytes32 hashLock;
    }
    /*
     *  Modifiers
     */
    modifier onlyRegistrar() {
        // for now keep unique registrar
        require(msg.sender == registrar);
        _;
    }

    constructor(
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        address _registrar,
        CoreInterface _core )
        public
        OpsManaged()
    {
        require(_chainIdValue != 0);
        require(_chainIdUtility != 0);
        require(_registrar != address(0));
        require(_core != address(0),"CoreInterface address cannot be null");
        chainIdValue = _chainIdValue;
        chainIdUtility = _chainIdUtility;
        registrar = _registrar;
        core = _core;

        uuidSTPrime = hashUuid(
            STPRIME_SYMBOL,
            STPRIME_NAME,
            _chainIdValue,
            _chainIdUtility,
            address(this),
            STPRIME_CONVERSION_RATE,
            STPRIME_CONVERSION_RATE_TOKEN_DECIMALS);

        simpleTokenPrime = new STPrime(
            uuidSTPrime,
            _chainIdValue,
            _chainIdUtility,
            STPRIME_CONVERSION_RATE,
            STPRIME_CONVERSION_RATE_TOKEN_DECIMALS);

        registeredTokens[uuidSTPrime] = RegisteredToken({
            token:          UtilityTokenInterface(simpleTokenPrime),
            registrar:      registrar
        });

        uuids.push(uuidSTPrime);
        // lock name and symbol route for ST'
        bytes32 hashName = keccak256(STPRIME_NAME);
        nameReservation[hashName] = registrar;
        bytes32 hashSymbol = keccak256(STPRIME_SYMBOL);
        symbolRoute[hashSymbol] = simpleTokenPrime;

        // @dev read STPrime address and uuid from contract
    }

    /*
     *  External functions
     */
    function confirmStakingIntent(
        bytes32 _uuid,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amountST,
        uint256 _amountUT,
        uint256 _stakingUnlockHeight,
        bytes32 _hashLock,
        bytes32 _stakingIntentHash,
        bytes32 _blockHeight,
        bytes rlpParentNodes)
        external
        returns (uint256 expirationHeight)
    {
        require(address(registeredTokens[_uuid].token) != address(0));

        require(nonces[_staker] < _stakerNonce);
        require(_amountST > 0);
        require(_amountUT > 0);
        // stakingUnlockheight needs to be checked against the core that tracks the value chain
        require(_stakingUnlockHeight > 0);
        require(_stakingIntentHash != "");


        expirationHeight = block.number + blocksToWaitShort();
        nonces[_staker] = _stakerNonce;

        bytes32 stakingIntentHash = hashStakingIntent(
            _uuid,
            _staker,
            _stakerNonce,
            _beneficiary,
            _amountST,
            _amountUT,
            _stakingUnlockHeight,
            _hashLock
        );

        require(stakingIntentHash == _stakingIntentHash);
         bytes32 storageRoot = core.storageRoots(_blockHeight);

         require(MerklePatriciaProof.verify(keccak256(stakingIntentHash),OpenSTUtils.storagePath(5, keccak256(staker,stakerNonce)) ,rlpParentNodes,storageRoot));

        mints[stakingIntentHash] = Mint({
            uuid:             _uuid,
            staker:           _staker,
            beneficiary:      _beneficiary,
            amount:           _amountUT,
            expirationHeight: expirationHeight,
            hashLock:         _hashLock
        });

        emit StakingIntentConfirmed(_uuid, stakingIntentHash, _staker, _beneficiary, _amountST,
                _amountUT, expirationHeight, _blockHeight ,storageRoot);

        return expirationHeight;
    }

    function processMinting(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret)
        external
        returns (address tokenAddress)
    {
        require(_stakingIntentHash != "");

        Mint storage mint = mints[_stakingIntentHash];

        // present secret to unlock hashlock and continue process
        require(mint.hashLock == keccak256(_unlockSecret));

        // as process minting results in a gain it needs to expire well before
        // the escrow on the cost unlocks in OpenSTValue.processStake
        require(mint.expirationHeight > block.number);

        UtilityTokenInterface token = registeredTokens[mint.uuid].token;
        tokenAddress = address(token);
        require(tokenAddress != address(0));

        require(token.mint(mint.beneficiary, mint.amount));

        emit ProcessedMint(mint.uuid, _stakingIntentHash, tokenAddress, mint.staker,
            mint.beneficiary, mint.amount, _unlockSecret);

        delete mints[_stakingIntentHash];

        return tokenAddress;
    }

    function revertMinting(
        bytes32 _stakingIntentHash)
        external
        returns (
        bytes32 uuid,
        address staker,
        address beneficiary,
        uint256 amount)
    {
        require(_stakingIntentHash != "");

        Mint storage mint = mints[_stakingIntentHash];

        // require that the mint has expired and that the staker has not
        // processed the minting, ie mint has not been deleted
        require(mint.expirationHeight > 0);
        require(mint.expirationHeight <= block.number);

        uuid = mint.uuid;
        amount = mint.amount;
        staker = mint.staker;
        beneficiary = mint.beneficiary;

        delete mints[_stakingIntentHash];

        emit RevertedMint(uuid, _stakingIntentHash, staker, beneficiary, amount);

        return (uuid, staker, beneficiary, amount);
    }

    /// @dev redeemer must set an allowance for the branded token with OpenSTUtility
    ///      as the spender so that the branded token can be taken into escrow by OpenSTUtility
    ///      note: for STPrime, call OpenSTUtility.redeemSTPrime as a payable function
    ///      note: nonce must be queried from OpenSTValue contract
    ///      note: Redemption will be done to beneficiary address
    function redeem(
        bytes32 _uuid,
        uint256 _amountBT,
        uint256 _nonce,
        address _beneficiary,
        bytes32 _hashLock)
        external
        returns (
        uint256 unlockHeight,
        bytes32 redemptionIntentHash)
    {
        require(_uuid != "");
        require(_amountBT > 0);
        require(_beneficiary != address(0));
        // on redemption allow the nonce to be re-used to cover for an unsuccessful
        // previous redemption previously; as the nonce is strictly increasing plus
        // one on the value chain; there is no gain on redeeming with the same nonce,
        // only self-inflicted cost.
        require(_nonce >= nonces[msg.sender]);
        nonces[msg.sender] = _nonce;

        // to redeem ST' one needs to send value to payable
        // function redeemSTPrime
        require(_uuid != uuidSTPrime);

        BrandedToken token = BrandedToken(registeredTokens[_uuid].token);

        require(token.allowance(msg.sender, address(this)) >= _amountBT);
        require(token.transferFrom(msg.sender, address(this), _amountBT));

        unlockHeight = block.number + blocksToWaitLong();

        redemptionIntentHash = hashRedemptionIntent(
                _uuid,
                msg.sender,
                _nonce,
                _beneficiary,
                _amountBT,
                unlockHeight,
                _hashLock
        );

        redemptions[redemptionIntentHash] = Redemption({
            uuid:         _uuid,
            redeemer:     msg.sender,
            nonce:        _nonce,
            beneficiary:  _beneficiary,
            amountUT:     _amountBT,
            unlockHeight: unlockHeight,
            hashLock:     _hashLock
        });

        // store the Redemption intent hash directly in storage of OpenSTUtility
        // so that a Merkle proof can be generated for active redemption intents
        intents[hashIntentKey(msg.sender, _nonce)] = redemptionIntentHash;

        emit RedemptionIntentDeclared(_uuid, redemptionIntentHash, address(token),
            msg.sender, _nonce, _beneficiary, _amountBT, unlockHeight, chainIdValue);

        return (unlockHeight, redemptionIntentHash);
    }

    /// @dev redeemer must send as value the amount STP to redeem
    ///      note: nonce must be queried from OpenSTValue contract
    ///      note: redemption will be done to beneficiary address
    function redeemSTPrime(
        uint256 _nonce,
        address _beneficiary,
        bytes32 _hashLock)
        external
        payable
        returns (
        uint256 amountSTP,
        uint256 unlockHeight,
        bytes32 redemptionIntentHash)
    {
        require(msg.value > 0);
        require(_beneficiary != address(0));
        // on redemption allow the nonce to be re-used to cover for an unsuccessful
        // previous redemption previously; as the nonce is strictly increasing plus
        // one on the value chain; there is no gain on redeeming with the same nonce,
        // only self-inflicted cost.
        require(_nonce >= nonces[msg.sender]);
        nonces[msg.sender] = _nonce;

        amountSTP = msg.value;
        unlockHeight = block.number + blocksToWaitLong();

        redemptionIntentHash = hashRedemptionIntent(
                uuidSTPrime,
                msg.sender,
                _nonce,
                _beneficiary,
                amountSTP,
                unlockHeight,
                _hashLock
        );

        redemptions[redemptionIntentHash] = Redemption({
            uuid:         uuidSTPrime,
            redeemer:     msg.sender,
            nonce:        _nonce,
            beneficiary:  _beneficiary,
            amountUT:     amountSTP,
            unlockHeight: unlockHeight,
            hashLock:     _hashLock
        });

        emit RedemptionIntentDeclared(uuidSTPrime, redemptionIntentHash, simpleTokenPrime,
            msg.sender, _nonce, _beneficiary, amountSTP, unlockHeight, chainIdValue);

        return (amountSTP, unlockHeight, redemptionIntentHash);
    }

    function processRedeeming(
        bytes32 _redemptionIntentHash,
        bytes32 _unlockSecret)
        external
        returns (
        address tokenAddress)
    {
        require(_redemptionIntentHash != "");

        Redemption storage redemption = redemptions[_redemptionIntentHash];

        // present the secret to unlock the hashlock and continue process
        require(redemption.hashLock == keccak256(_unlockSecret));

        // as process redemption bears the cost there is no need to require
        // the unlockHeight is not past, the same way as we do require for
        // the expiration height on the unstake to not have expired yet.

        UtilityTokenInterface token = registeredTokens[redemption.uuid].token;
        tokenAddress = address(token);
        require(tokenAddress != address(0));

        uint256 value = 0;
        if (redemption.uuid == uuidSTPrime) value = redemption.amountUT;

        require(token.burn.value(value)(redemption.redeemer, redemption.amountUT));

        emit ProcessedRedemption(redemption.uuid, _redemptionIntentHash, token,
            redemption.redeemer, redemption.beneficiary, redemption.amountUT, _unlockSecret);

        delete redemptions[_redemptionIntentHash];

        // remove intent hash from intents mapping
        delete intents[hashIntentKey(redemption.redeemer, redemption.nonce)];

        return tokenAddress;
    }

    function revertRedemption(
        bytes32 _redemptionIntentHash)
        external
        returns (
        bytes32 uuid,
        address redeemer,
        address beneficiary,
        uint256 amountUT)
    {
        require(_redemptionIntentHash != "");

        Redemption storage redemption = redemptions[_redemptionIntentHash];

        // require that the redemption is unlocked and exists
        require(redemption.unlockHeight > 0);
        require(redemption.unlockHeight <= block.number);

        uuid = redemption.uuid;
        amountUT = redemption.amountUT;
        redeemer = redemption.redeemer;
        beneficiary = redemption.beneficiary;

        if (redemption.uuid == uuidSTPrime) {
            // transfer throws if insufficient funds
            redeemer.transfer(amountUT);
        } else {
            EIP20Interface token = EIP20Interface(registeredTokens[redemption.uuid].token);

            require(token.transfer(redemption.redeemer, redemption.amountUT));
        }

        delete redemptions[_redemptionIntentHash];

        // fire event
        emit RevertedRedemption(uuid, _redemptionIntentHash, redeemer, beneficiary, amountUT);

        return (uuid, redeemer, beneficiary, amountUT);
    }

    /*
     *  Public functions
     */
    /// @dev Congratulations on looking under the hood and obtaining ST' to call proposeBrandedToken;
    ///      however, OpenSTFoundation is not yet actively listening to these events
    ///      because to automate it we will build a web UI where you can authenticate
    ///      with your msg.sender = _requester key;
    ///      until that time please drop us a line on partners(at)simpletoken.org and we can
    ///      work with you to register for your branded token
    function proposeBrandedToken(
        string _symbol,
        string _name,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        returns (bytes32)
    {
        require(bytes(_symbol).length > 0);
        require(bytes(_name).length > 0);
        require(_conversionRate > 0);
        require(_conversionRateDecimals <= 5);

        bytes32 hashSymbol = keccak256(_symbol);
        bytes32 hashName = keccak256(_name);
        require(checkAvailability(hashSymbol, hashName, msg.sender));

        bytes32 btUuid = hashUuid(
            _symbol,
            _name,
            chainIdValue,
            chainIdUtility,
            address(this),
            _conversionRate,
            _conversionRateDecimals);

        BrandedToken proposedBT = new BrandedToken(
            btUuid,
            _symbol,
            _name,
            TOKEN_DECIMALS,
            chainIdValue,
            chainIdUtility,
            _conversionRate,
            _conversionRateDecimals);
        // reserve name for sender under opt-in discretion of
        // registrar
        nameReservation[hashName] = msg.sender;

        emit ProposedBrandedToken(msg.sender, address(proposedBT), btUuid,
            _symbol, _name, _conversionRate, _conversionRateDecimals);

        return btUuid;
    }

    function checkAvailability(
        bytes32 _hashSymbol,
        bytes32 _hashName,
        address _requester)
        public
        view
        returns (bool /* success */)
    {
        // a reserved symbol means the route is already chosen
        address token = symbolRoute[_hashSymbol];
        if (token != address(0)) return false;

        // a name can have been reserved during the Simple Token sale
        // in which case must come from same address
        // otherwise proposals are first come, first serve
        // under opt-in discretion of registrar
        address requester = nameReservation[_hashName];
        if ((requester == address(0) ||
            requester == _requester)) {
            return true;
        }
        return false;
    }

    /// @dev Returns size of uuids
    /// @return size
    function getUuidsSize() public view returns (uint256) {
        return uuids.length;
    }


    /* solhint-disable-next-line separate-by-one-line-in-contract */
    function registerBrandedToken(
        string _symbol,
        string _name,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        address _requester,
        UtilityTokenInterface _brandedToken,
        bytes32 _checkUuid)
        public
        onlyRegistrar
        returns (bytes32 registeredUuid)
    {
        require(bytes(_symbol).length > 0);
        require(bytes(_name).length > 0);
        require(_conversionRate > 0);
        require(_conversionRateDecimals <= 5);

        bytes32 hashSymbol = keccak256(_symbol);
        bytes32 hashName = keccak256(_name);
        require(checkAvailability(hashSymbol, hashName, _requester));

        registeredUuid = hashUuid(
            _symbol,
            _name,
            chainIdValue,
            chainIdUtility,
            address(this),
            _conversionRate,
            _conversionRateDecimals);

        require(registeredUuid == _checkUuid);
        require(_brandedToken.uuid() == _checkUuid);

        assert(address(registeredTokens[registeredUuid].token) == address(0));

        registeredTokens[registeredUuid] = RegisteredToken({
            token:          _brandedToken,
            registrar:      registrar
        });

        // register name to registrar
        nameReservation[hashName] = registrar;
        // register symbol
        symbolRoute[hashSymbol] = _brandedToken;
        uuids.push(registeredUuid);

        emit RegisteredBrandedToken(registrar, _brandedToken, registeredUuid, _symbol, _name,
            _conversionRate, _conversionRateDecimals, _requester);

        return registeredUuid;
    }

    /*
     *  Administrative functions
     */
    function initiateProtocolTransfer(
        ProtocolVersioned _token,
        address _proposedProtocol)
        public
        onlyAdmin
        returns (bool)
    {
        _token.initiateProtocolTransfer(_proposedProtocol);

        return true;
    }

    // on the very first released version v0.9.1 there is no need
    // to completeProtocolTransfer from a previous version

    /* solhint-disable-next-line separate-by-one-line-in-contract */
    function revokeProtocolTransfer(
        ProtocolVersioned _token)
        public
        onlyAdmin
        returns (bool)
    {
        _token.revokeProtocolTransfer();

        return true;
    }

    function blocksToWaitLong() public pure returns (uint256) {
        return BLOCKS_TO_WAIT_LONG;
    }

    function blocksToWaitShort() public pure returns (uint256) {
        return BLOCKS_TO_WAIT_SHORT;
    }
}

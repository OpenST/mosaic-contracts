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
// Value chain: OpenSTValue
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./Hasher.sol";
import "./OpsManaged.sol";
import "./EIP20Interface.sol";
import "./CoreInterface.sol";
import "./ProtocolVersioned.sol";

// value chain contracts
import "./SimpleStake.sol";
import "./ProofLib.sol";

/// @title OpenSTValue - value staking contract for OpenST
contract OpenSTValue is OpsManaged, Hasher {
    using SafeMath for uint256;

    /*
     *  Events
     */
    event UtilityTokenRegistered(bytes32 indexed _uuid, address indexed stake,
        string _symbol, string _name, uint8 _decimals, uint256 _conversionRate, uint8 _conversionRateDecimals,
        uint256 _chainIdUtility, address indexed _stakingAccount);

    event StakingIntentDeclared(bytes32 indexed _uuid, address indexed _staker,
        uint256 _stakerNonce, bytes32 _intentKeyHash, address _beneficiary, uint256 _amountST,
        uint256 _amountUT, uint256 _unlockHeight, bytes32 _stakingIntentHash,
        uint256 _chainIdUtility);

    event ProcessedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
        address _stake, address _staker, uint256 _amountST, uint256 _amountUT, bytes32 _unlockSecret);

    event RevertedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
        address _staker, uint256 _amountST, uint256 _amountUT);

    event RedemptionIntentConfirmed(bytes32 indexed _uuid, bytes32 _redemptionIntentHash,
        address _redeemer, address _beneficiary, uint256 _amountST, uint256 _amountUT, uint256 _expirationHeight);

    event ProcessedUnstake(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
        address stake, address _redeemer, address _beneficiary, uint256 _amountST, bytes32 _unlockSecret);

    event RevertedUnstake(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
        address _redeemer, address _beneficiary, uint256 _amountST);

    /*
     *  Constants
     */
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);

    // 2 weeks in seconds
    uint256 private constant TIME_TO_WAIT_LONG = 1209600;

    // 1hour in seconds
    uint256 private constant TIME_TO_WAIT_SHORT = 3600;

    // indentified index position of redemptionIntents mapping in storage (in OpenSTUtility)
    // positions 0-3 are occupied by public state variables in OpsManaged and Owned
    // private constants do not occupy the storage of a contract 
    uint8 internal constant intentsMappingStorageIndexPosition = 4;

    // storage for staking intent hash of active staking intents
    mapping(bytes32 /* hashIntentKey */ => bytes32 /* stakingIntentHash */) public stakingIntents;
    // register the active stakes and unstakes
    mapping(bytes32 /* hashStakingIntent */ => Stake) public stakes;
    mapping(uint256 /* chainIdUtility */ => CoreInterface) internal cores;
    mapping(bytes32 /* uuid */ => UtilityToken) public utilityTokens;
    /// nonce makes the staking process atomic across the two-phased process
    /// and protects against replay attack on (un)staking proofs during the process.
    /// On the value chain nonces need to strictly increase by one; on the utility
    /// chain the nonce need to strictly increase (as one value chain can have multiple
    /// utility chains)
    mapping(address /* (un)staker */ => uint256) internal nonces;
    mapping(bytes32 /* hashRedemptionIntent */ => Unstake) public unstakes;

    /*
     *  Storage
     */
    uint256 public chainIdValue;
    EIP20Interface public valueToken;
    address public registrar;
    uint256 public blocksToWaitShort;
    uint256 public blocksToWaitLong;

    bytes32[] public uuids;

    /*
     *  Structures
     */
    struct UtilityToken {
        string symbol;
        string name;
        uint256 conversionRate;
        uint8 conversionRateDecimals;
        uint8 decimals;
        uint256 chainIdUtility;
        SimpleStake simpleStake;
        address stakingAccount;
    }

    struct Stake {
        bytes32 uuid;
        address staker;
        address beneficiary;
        uint256 nonce;
        uint256 amountST;
        uint256 amountUT;
        uint256 unlockHeight;
        bytes32 hashLock;
    }

    struct Unstake {
        bytes32 uuid;
        address redeemer;
        address beneficiary;
        uint256 amountST;
        // @dev consider removal of amountUT
        uint256 amountUT;
        uint256 expirationHeight;
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
        EIP20Interface _eip20token,
        address _registrar,
        uint256 _valueChainBlockGenerationTime)
        public
        OpsManaged()
    {
        require(_chainIdValue != 0);
        require(_eip20token != address(0));
        require(_registrar != address(0));
        require(_valueChainBlockGenerationTime != 0);

        blocksToWaitShort = TIME_TO_WAIT_SHORT.div(_valueChainBlockGenerationTime);
        blocksToWaitLong = TIME_TO_WAIT_LONG.div(_valueChainBlockGenerationTime);

        chainIdValue = _chainIdValue;
        valueToken = _eip20token;
        // registrar cannot be reset
        // TODO: require it to be a contract
        registrar = _registrar;
    }

    /*
     *  External functions
     */
    /// @dev In order to stake the tx.origin needs to set an allowance
    ///      for the OpenSTValue contract to transfer to itself to hold
    ///      during the staking process.
    function stake(
        bytes32 _uuid,
        uint256 _amountST,
        address _beneficiary,
        bytes32 _hashLock,
        address _staker)
        external
        returns (
        uint256 amountUT,
        uint256 nonce,
        uint256 unlockHeight,
        bytes32 stakingIntentHash)
        /* solhint-disable-next-line function-max-lines */
    {
        /* solhint-disable avoid-tx-origin */
        // check the staking contract has been approved to spend the amount to stake
        // OpenSTValue needs to be able to transfer the stake into its balance for
        // keeping until the two-phase process is completed on both chains.
        require(_amountST > uint256(0));

        require(utilityTokens[_uuid].simpleStake != address(0));
        require(_beneficiary != address(0));
        require(_staker != address(0));

        UtilityToken storage utilityToken = utilityTokens[_uuid];

        // if the staking account is set to a non-zero address,
        // then all stakes have come (from/over) the staking account
        if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);
        require(valueToken.transferFrom(msg.sender, address(this), _amountST));

        amountUT = (_amountST.mul(utilityToken.conversionRate))
            .div(10**uint256(utilityToken.conversionRateDecimals));
        unlockHeight = block.number + blocksToWaitLong;

        nonces[_staker]++;
        nonce = nonces[_staker];

        stakingIntentHash = hashStakingIntent(
            _uuid,
            _staker,
            nonce,
            _beneficiary,
            _amountST,
            amountUT,
            unlockHeight,
            _hashLock
        );

        stakes[stakingIntentHash] = Stake({
            uuid:         _uuid,
            staker:       _staker,
            beneficiary:  _beneficiary,
            nonce:        nonce,
            amountST:     _amountST,
            amountUT:     amountUT,
            unlockHeight: unlockHeight,
            hashLock:     _hashLock
        });

        // store the staking intent hash directly in storage of OpenSTValue 
        // so that a Merkle proof can be generated for active staking intents
        bytes32 intentKeyHash = hashIntentKey(_staker, nonce);
        stakingIntents[intentKeyHash] = stakingIntentHash;

        emit StakingIntentDeclared(_uuid, _staker, nonce, intentKeyHash, _beneficiary,
            _amountST, amountUT, unlockHeight, stakingIntentHash, utilityToken.chainIdUtility);

        return (amountUT, nonce, unlockHeight, stakingIntentHash);
        /* solhint-enable avoid-tx-origin */
    }

    function processStaking(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret)
        external
        returns (address stakeAddress)
    {
        require(_stakingIntentHash != "");

        Stake storage stakeItem = stakes[_stakingIntentHash];

        // present the secret to unlock the hashlock and continue process
        require(stakeItem.hashLock == keccak256(abi.encodePacked(_unlockSecret)));

        // as this bears the cost, there is no need to require
        // that the stakeItem.unlockHeight is not yet surpassed
        // as is required on processMinting

        UtilityToken storage utilityToken = utilityTokens[stakeItem.uuid];
        // if the staking account is set to a non-zero address,
        // then all stakes have come (from/over) the staking account
        if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);
        stakeAddress = address(utilityToken.simpleStake);
        require(stakeAddress != address(0));

        assert(valueToken.balanceOf(address(this)) >= stakeItem.amountST);
        require(valueToken.transfer(stakeAddress, stakeItem.amountST));

        emit ProcessedStake(stakeItem.uuid, _stakingIntentHash, stakeAddress, stakeItem.staker,
            stakeItem.amountST, stakeItem.amountUT, _unlockSecret);
        
        // remove from stakingIntents mapping
        delete stakingIntents[hashIntentKey(stakeItem.staker, stakeItem.nonce)];

        delete stakes[_stakingIntentHash];

        return stakeAddress;
    }

    function revertStaking(
        bytes32 _stakingIntentHash)
        external
        returns (
        bytes32 uuid,
        uint256 amountST,
        address staker)
    {
        require(_stakingIntentHash != "");

        Stake storage stakeItem = stakes[_stakingIntentHash];
        UtilityToken storage utilityToken = utilityTokens[stakeItem.uuid];
        // if the staking account is set to a non-zero address,
        // then all stakes have come (from/over) the staking account
        if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);

        // require that the stake is unlocked and exists
        require(stakeItem.unlockHeight > 0);
        require(stakeItem.unlockHeight <= block.number);

        assert(valueToken.balanceOf(address(this)) >= stakeItem.amountST);
        // revert the amount that was intended to be staked back to staker
        require(valueToken.transfer(stakeItem.staker, stakeItem.amountST));

        uuid = stakeItem.uuid;
        amountST = stakeItem.amountST;
        staker = stakeItem.staker;

        emit RevertedStake(stakeItem.uuid, _stakingIntentHash, stakeItem.staker,
            stakeItem.amountST, stakeItem.amountUT);

        // remove from stakingIntents mapping
        delete stakingIntents[hashIntentKey(stakeItem.staker, stakeItem.nonce)];

        delete stakes[_stakingIntentHash];

        return (uuid, amountST, staker);
    }

    /**
      *	@notice Confirm redemption intent on value chain.
      *
      *	@dev RedemptionIntentHash is generated in Utility chain, the paramerters are that were used for hash generation
      *      is passed in this function along with rpl encoded parent nodes of merkle pactritia tree proof
      *      for RedemptionIntentHash.
      *
      *	@param _uuid UUID for utility token
      *	@param _redeemer Redeemer address
      *	@param _redeemerNonce Nonce for redeemer account
      *	@param _beneficiary Beneficiary address
      *	@param _amountUT Amount of utility token
      *	@param _redemptionUnlockHeight Unlock height for redemption
      *	@param _hashLock Hash lock
      *	@param _blockHeight Block height at which the Merkle proof was generated
      *	@param _rlpParentNodes RLP encoded parent nodes for proof verification
      *
      *	@return bytes32 amount of OST
      *	@return uint256 expiration height
      */
    function confirmRedemptionIntent(
        bytes32 _uuid,
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amountUT,
        uint256 _redemptionUnlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes _rlpParentNodes)
        external
        returns (
        uint256 amountST,
        uint256 expirationHeight)
    {
        UtilityToken storage utilityToken = utilityTokens[_uuid];
        require(utilityToken.simpleStake != address(0));
        require(_amountUT > 0);
        require(_beneficiary != address(0));
        // later core will provide a view on the block height of the
        // utility chain
        require(_redemptionUnlockHeight > 0);

        require(cores[utilityToken.chainIdUtility].safeUnlockHeight() < _redemptionUnlockHeight);

        nonces[_redeemer]++;
        require(nonces[_redeemer] == _redeemerNonce);
        
        bytes32 redemptionIntentHash = hashRedemptionIntent(
            _uuid,
            _redeemer,
            _redeemerNonce,
            _beneficiary,
            _amountUT,
            _redemptionUnlockHeight,
            _hashLock
        );

        expirationHeight = block.number + blocksToWaitShort;

        // minimal precision to unstake 1 STWei
        require(_amountUT >= (utilityToken.conversionRate.div(10**uint256(utilityToken.conversionRateDecimals))));
        amountST = (_amountUT
            .mul(10**uint256(utilityToken.conversionRateDecimals))).div(utilityToken.conversionRate);

        require(valueToken.balanceOf(address(utilityToken.simpleStake)) >= amountST);

        require(verifyRedemptionIntent(
                _uuid,
                _redeemer,
                _redeemerNonce,
                _blockHeight,
                redemptionIntentHash,
                _rlpParentNodes), "RedemptionIntentHash storage verification failed");

        unstakes[redemptionIntentHash] = Unstake({
            uuid:             _uuid,
            redeemer:         _redeemer,
            beneficiary:      _beneficiary,
            amountUT:         _amountUT,
            amountST:         amountST,
            expirationHeight: expirationHeight,
            hashLock:         _hashLock
        });

        emit RedemptionIntentConfirmed(_uuid, redemptionIntentHash, _redeemer,
            _beneficiary, amountST, _amountUT, expirationHeight);

        return (amountST, expirationHeight);
    }

    /**
      *	@notice Verify storage of redemption intent hash
      *
      *	@param _uuid UUID for utility token
      *	@param _redeemer Redeemer address
      *	@param _redeemerNonce Nonce for redeemer account
      *	@param _blockHeight Block height at which the Merkle proof was generated
      *	@param _rlpParentNodes RLP encoded parent nodes for proof verification
      *
      *	@return true if successfully verifies, otherwise throws an exception.
      */

    function verifyRedemptionIntent(
        bytes32 _uuid,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _blockHeight,
        bytes32 _redemptionIntentHash,
        bytes _rlpParentNodes)
        internal
        view
        returns (bool /* verification status */)
    {
        // get storageRoot from core for the given block height
        bytes32 storageRoot = CoreInterface(cores[utilityTokens[_uuid].chainIdUtility]).getStorageRoot(_blockHeight);

        // storageRoot cannot be 0
        require(storageRoot !=  bytes32(0), "storageRoot not found for given blockHeight");

        require(ProofLib.verifyIntentStorage(
                intentsMappingStorageIndexPosition,
                _redeemer,
                _redeemerNonce,
                _redemptionIntentHash,
                _rlpParentNodes,
                storageRoot), "RedemptionIntentHash storage verification failed");

        return true;
    }

    function processUnstaking(
        bytes32 _redemptionIntentHash,
        bytes32 _unlockSecret)
        external
        returns (
        address stakeAddress)
    {
        require(_redemptionIntentHash != "");

        Unstake storage unstake = unstakes[_redemptionIntentHash];

        // present secret to unlock hashlock and proceed
        require(unstake.hashLock == keccak256(abi.encodePacked(_unlockSecret)));

        // as the process unstake results in a gain for the caller
        // it needs to expire well before the process redemption can
        // be reverted in OpenSTUtility
        require(unstake.expirationHeight > block.number);

        UtilityToken storage utilityToken = utilityTokens[unstake.uuid];
        stakeAddress = address(utilityToken.simpleStake);
        require(stakeAddress != address(0));

        require(utilityToken.simpleStake.releaseTo(unstake.beneficiary, unstake.amountST));

        emit ProcessedUnstake(unstake.uuid, _redemptionIntentHash, stakeAddress,
            unstake.redeemer, unstake.beneficiary, unstake.amountST, _unlockSecret);

        delete unstakes[_redemptionIntentHash];

        return stakeAddress;
    }

    function revertUnstaking(
        bytes32 _redemptionIntentHash)
        external
        returns (
        bytes32 uuid,
        address redeemer,
        address beneficiary,
        uint256 amountST)
    {
        require(_redemptionIntentHash != "");

        Unstake storage unstake = unstakes[_redemptionIntentHash];

        // require that the unstake has expired and that the redeemer has not
        // processed the unstaking, ie unstake has not been deleted
        require(unstake.expirationHeight > 0);
        require(unstake.expirationHeight <= block.number);

        uuid = unstake.uuid;
        redeemer = unstake.redeemer;
        beneficiary = unstake.beneficiary;
        amountST = unstake.amountST;

        delete unstakes[_redemptionIntentHash];

        emit RevertedUnstake(uuid, _redemptionIntentHash, redeemer, beneficiary, amountST);

        return (uuid, redeemer, beneficiary, amountST);
    }

    function core(
        uint256 _chainIdUtility)
        external
        view
        returns (address /* core address */ )
    {
        return address(cores[_chainIdUtility]);
    }

    /*
     *  Public view functions
     */
    function getNextNonce(
        address _account)
        public
        view
        returns (uint256 /* nextNonce */)
    {
        return (nonces[_account] + 1);
    }

    /// @dev Returns size of uuids
    /// @return size
    function getUuidsSize() public view returns (uint256) {
        return uuids.length;
    }

    /*
     *  Registrar functions
     */
    function addCore(
        CoreInterface _core)
        public
        onlyRegistrar
        returns (bool /* success */)
    {
        require(address(_core) != address(0));
        // on value chain core only tracks a remote utility chain
        uint256 chainIdUtility = _core.chainIdRemote();
        require(chainIdUtility != 0);
        // cannot overwrite core for given chainId
        require(cores[chainIdUtility] == address(0));

        cores[chainIdUtility] = _core;

        return true;
    }

    function registerUtilityToken(
        string _symbol,
        string _name,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        uint256 _chainIdUtility,
        address _stakingAccount,
        bytes32 _checkUuid)
        public
        onlyRegistrar
        returns (bytes32 uuid)
    {
        require(bytes(_name).length > 0);
        require(bytes(_symbol).length > 0);
        require(_conversionRate > 0);
        require(_conversionRateDecimals <= 5);

        address openSTRemote = cores[_chainIdUtility].openSTRemote();
        require(openSTRemote != address(0));

        uuid = hashUuid(
            _symbol,
            _name,
            chainIdValue,
            _chainIdUtility,
            openSTRemote,
            _conversionRate,
            _conversionRateDecimals);

        require(uuid == _checkUuid);

        require(address(utilityTokens[uuid].simpleStake) == address(0));

        SimpleStake simpleStake = new SimpleStake(
            valueToken, address(this), uuid);

        utilityTokens[uuid] = UtilityToken({
            symbol:         _symbol,
            name:           _name,
            conversionRate: _conversionRate,
            conversionRateDecimals: _conversionRateDecimals,
            decimals:       TOKEN_DECIMALS,
            chainIdUtility: _chainIdUtility,
            simpleStake:    simpleStake,
            stakingAccount: _stakingAccount
        });
        uuids.push(uuid);

        emit UtilityTokenRegistered(uuid, address(simpleStake), _symbol, _name,
            TOKEN_DECIMALS, _conversionRate, _conversionRateDecimals, _chainIdUtility, _stakingAccount);

        return uuid;
    }

    /**
     *  @notice Initiates protocol transfer.
     *
     *  @param _protocolVersioned The address of the current protocol.
     *  @param _proposedProtocol The address of the proposed protocol.
     *
     *  @return bool true in case of success, otherwise throws an exception.
     */
    function initiateProtocolTransfer(
        ProtocolVersioned _protocolVersioned,
        address _proposedProtocol)
        public
        onlyAdmin
        returns (bool)
    {
        _protocolVersioned.initiateProtocolTransfer(_proposedProtocol);

        return true;
    }

    /**
     *  @notice Revokes protocol transfer.
     *
     *  @param _protocolVersioned The address of the current protocol.
     *
     *  @return bool true in case of success, otherwise throws an exception.
     */
    function revokeProtocolTransfer(
        ProtocolVersioned _protocolVersioned)
        public
        onlyAdmin
        returns (bool)
    {
        _protocolVersioned.revokeProtocolTransfer();

        return true;
    }

    function getStakerAddress(
        bytes32 _stakingIntentHash)
        view
        external
        returns (address /* staker */)
    {
        require(_stakingIntentHash != "");
        Stake storage stakeItem = stakes[_stakingIntentHash];

        return stakeItem.staker;

    }
}

pragma solidity ^0.4.23;

import './GatewayLib.sol';
import "./CoreInterface.sol";
import "./SafeMath.sol";

/**
 *  @title GatewayBase contract.
 *
 *  @notice GatewayBase contains general purpose functions shared between
 *  gateway and co-gateway contract.
 */
contract GatewayBase {

    using SafeMath for uint256;
    /** Emitted whenever a Gateway/CoGateway contract is proven.
     *	wasAlreadyProved parameter differentiates between first call and replay
     *  call of proveGateway method for same block height
     */
    event GatewayProven(
        address _gateway,
        uint256 _blockHeight,
        bytes32 _storageRoot,
        bool _wasAlreadyProved
    );

    bytes32 constant STAKE_TYPEHASH = keccak256(
        abi.encode(
            "Stake(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    bytes32 constant REDEEM_TYPEHASH = keccak256(
        abi.encode(
            "Redeem(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );
    bytes32 constant GATEWAY_LINK_TYPEHASH = keccak256(
        abi.encode(
            "GatewayLink(bytes32 messageHash,MessageBus.Message message)"
        )
    );

    /** address of core contract. */
    CoreInterface public core;

    /** path to prove merkle account proof for CoGateway contract. */
    bytes internal encodedGatewayPath;

    /** Gateway contract address. */
    address public gateway;

    /** Maps blockHeight to storageRoot*/
    mapping(uint256 /* block height */ => bytes32) internal storageRoots;

    constructor(
        CoreInterface _core
    )
    public
    {
        core = _core;

    }

    /* external functions */

    /**
 *  @notice External function prove gateway/co-gateway.
 *
 *  @dev proveGateway can be called by anyone to verify merkle proof of
 *       gateway/co-gateway contract address. Trust factor is brought by stateRoots
 *       mapping. stateRoot is committed in commitStateRoot function by
 *       mosaic process which is a trusted decentralized system running
 *       separately. It's important to note that in replay calls of
 *       proveGateway bytes _rlpParentNodes variable is not validated. In
 *       this case input storage root derived from merkle proof account
 *       nodes is verified with stored storage root of given blockHeight.
 *		 GatewayProven event has parameter wasAlreadyProved to
 *       differentiate between first call and replay calls.
 *
 *  @param _blockHeight Block height at which Gateway/CoGateway is to be proven.
 *  @param _rlpEncodedAccount RLP encoded account node object.
 *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
 *
 *  @return `true` if Gateway account is proved
 */
    function proveGateway(
        uint256 _blockHeight,
        bytes _rlpEncodedAccount,
        bytes _rlpParentNodes
    )
    external
    returns (bool /* success */)
    {
        // _rlpEncodedAccount should be valid
        require(
            _rlpEncodedAccount.length != 0,
            "Length of RLP encoded account is 0"
        );

        // _rlpParentNodes should be valid
        require(
            _rlpParentNodes.length != 0,
            "Length of RLP parent nodes is 0"
        );

        bytes32 stateRoot = core.getStateRoot(_blockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "State root must not be zero"
        );

        // If account already proven for block height
        bytes32 provenStorageRoot = storageRoots[_blockHeight];

        if (provenStorageRoot != bytes32(0)) {

            // Check extracted storage root is matching with existing stored
            // storage root
            require(
                provenStorageRoot == storageRoot,
                "Storage root mismatch when account is already proven"
            );

            // wasAlreadyProved is true here since proveOpenST is replay call
            // for same block height
            emit GatewayProven(
                gateway,
                _blockHeight,
                storageRoot,
                true
            );

            // return true
            return true;
        }

        bytes32 storageRoot = GatewayLib.proveAccount(
            _rlpEncodedAccount,
            _rlpParentNodes,
            encodedGatewayPath,
            stateRoot
        );

        storageRoots[_blockHeight] = storageRoot;

        // wasAlreadyProved is false since Gateway is called for the first time
        // for a block height
        emit GatewayProven(
            gateway,
            _blockHeight,
            storageRoot,
            false
        );

        return true;
    }

}

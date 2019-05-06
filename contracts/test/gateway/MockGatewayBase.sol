pragma solidity ^0.5.0;

import "../lib/MockGatewayLib.sol";
import "../../gateway/GatewayBase.sol";
import "../../lib/OrganizationInterface.sol";
import "../../lib/StateRootInterface.sol";

/**
 * @title MockGatewayBase contract.
 *
 * @notice Used for test only.
 */
contract MockGatewayBase is GatewayBase {

    /* Constructor */

    /**
     * @notice This is used for testing.
     *
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                stake process.
     * @param _organization Address of a contract that manages workers.
     * @param _maxStorageRootItems Defines how many storage roots should be
     *                             stored in circular buffer.
     */
    constructor(
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization,
        uint256 _maxStorageRootItems
    )
        public
        GatewayBase(
            _stateRootProvider,
            _bounty,
            _organization,
            _maxStorageRootItems
        )
    {}

    /* external functions */

    /**
     *  @notice External function prove gateway/co-gateway.
     *
     *  @dev proveGateway can be called by anyone to verify merkle proof of
     *       gateway/co-gateway contract address. Trust factor is brought by
     *       stateRoots mapping. It's important to note that in replay calls of
     *       proveGateway bytes _rlpParentNodes variable is not validated. In
     *       this case input storage root derived from merkle proof account
     *       nodes is verified with stored storage root of given blockHeight.
     *       GatewayProven event has parameter wasAlreadyProved to
     *       differentiate between first call and replay calls.
     *
     *  @param _blockHeight Block height at which Gateway/CoGateway is to be
     *                      proven.
     *  @param _rlpAccount RLP encoded account node object.
     *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
     *
     *  @return `true` if Gateway account is proved
     */
    function proveGateway(
        uint256 _blockHeight,
        bytes calldata _rlpAccount,
        bytes calldata _rlpParentNodes
    )
        external
        returns (bool)
    {
        // _rlpAccount should be valid
        require(
            _rlpAccount.length != 0,
            "Length of RLP account must not be 0."
        );

        // _rlpParentNodes should be valid
        require(
            _rlpParentNodes.length != 0,
            "Length of RLP parent nodes must not be 0."
        );

        bytes32 stateRoot = stateRootProvider.getStateRoot(_blockHeight);

        //State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "height must have a known state root"
        );

        // If account already proven for block height
        bytes32 provenStorageRoot = storageRoots[_blockHeight];

        if (provenStorageRoot != bytes32(0)) {


            // wasAlreadyProved is true here since proveOpenST is replay call
            // for same block height
            emit GatewayProven(
                remoteGateway,
                _blockHeight,
                provenStorageRoot,
                true
            );
            // return true
            return true;
        }

        // On successful proof verification storage root is returned other wise
        // transaction is reverted.
        bytes32 storageRoot = MockGatewayLib.proveAccount(
            _rlpAccount,
            _rlpParentNodes,
            encodedGatewayPath,
            stateRoot
        );

        storageRoots[_blockHeight] = storageRoot;

        // wasAlreadyProved is false since Gateway is called for the first time
        // for a block height
        emit GatewayProven(
            remoteGateway,
            _blockHeight,
            storageRoot,
            false
        );

        return true;
    }
}

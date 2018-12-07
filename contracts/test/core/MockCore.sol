pragma solidity ^0.5.0;

import "../../lib/OrganizationInterface.sol";
import "../../gateway/Core.sol";

/**
 * @title CoreMock contract
 *
 * @notice Used for test only
 */
contract MockCore is Core {


    /*  Public functions */

    /**
     * @notice Contract constructor
     *
     * @param _chainIdRemote if current chain is value then _chainIdRemote is
     *                       chain id of utility chain.
     * @param _blockHeight block height at which _stateRoot needs to store.
     * @param _stateRoot state root hash of given _blockHeight.
     *  @param _membersManager Address of a members manager contract.
     */
    constructor(
        uint256 _chainIdRemote,
        uint256 _blockHeight,
        bytes32 _stateRoot,
        IsMemberInterface _membersManager
    )
        Core(
            _chainIdRemote,
            _blockHeight,
            _stateRoot,
            _membersManager
        )
        public
    {}

    /**
     * @notice Get the mocked state root.
     *
     * @dev This is for testing only so the data is mocked here. Also please
     *      note the Core contract has defined this function as view,
     *      so to keep this overridden function as view, reading a storage
     *      variable.
     *
     * @return bytes32 Mocked state root.
     */
    function getStateRoot(uint256)
        external
        view
        returns (bytes32)
    {
        // Hashing dummy data.
        return keccak256(abi.encodePacked("dummy data"));
    }
}

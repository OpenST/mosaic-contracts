pragma solidity ^0.5.0;

import "../../gateway/WorkersInterface.sol";
import "../../gateway/SafeCore.sol";

/**
 * @title MockSafeCore contract
 *
 * @notice Used for test only
 */
contract MockSafeCore is SafeCore {


    /*  Public functions */

    /**
     * @notice Contract constructor
     *
     * @param _chainIdOrigin chain id where current core contract is deployed since core contract can be deployed on remote chain also
     * @param _chainIdRemote if current chain is value then _chainIdRemote is chain id of utility chain
     * @param _blockHeight block height at which _stateRoot needs to store
     * @param _stateRoot state root hash of given _blockHeight
     * @param _workers Workers contract address
     */
    constructor(
        uint256 _chainIdOrigin,
        uint256 _chainIdRemote,
        uint256 _blockHeight,
        bytes32 _stateRoot,
        WorkersInterface _workers
    )
        SafeCore(
            _chainIdOrigin,
            _chainIdRemote,
            _blockHeight,
            _stateRoot,
            _workers
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
        // hashing dummy data
        return keccak256(abi.encodePacked(coreChainIdOrigin));
    }
}

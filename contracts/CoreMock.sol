pragma solidity ^0.4.23;
import "./Core.sol";

contract CoreMock is Core{

    /**
      * @notice Contract constructor
      *
      * @param _registrar address of the registrar which registers for utility tokens
      * @param _chainIdOrigin chain id where current core contract is deployed since core contract can be deployed on remote chain also
      * @param _chainIdRemote if current chain is value then _chainIdRemote is chain id of utility chain
      * @param _openSTRemote if current chain is value then _openSTRemote is address of openSTUtility contract address
      * @param _blockHeight block height at which _stateRoot needs to store
      * @param _stateRoot state root hash of given _blockHeight
      * @param _workers Workers contract address
      */
     constructor(
         address _registrar,
         uint256 _chainIdOrigin,
         uint256 _chainIdRemote,
         address _openSTRemote,
         uint256 _blockHeight,
         bytes32 _stateRoot,
         WorkersInterface _workers)
        Core(_registrar, _chainIdOrigin, _chainIdRemote, _openSTRemote, _blockHeight, _stateRoot, _workers) public { }

     /**
       * @notice public view function getStorageRoot.
       *
       * @dev this is for testing only.
       *
       * @param _blockHeight block height for which storage root is needed.
       *
       * @return storage root
       */
    function getStorageRoot(
        uint256 _blockHeight)
    public
    view
    returns (bytes32 /* storage root */)
    {
        return keccak256(_blockHeight);
    }
}
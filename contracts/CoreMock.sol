pragma solidity ^0.4.23;
import "./Core.sol";

contract CoreMock is Core{

    /**
      * @notice Contract constructor
      *
      * @param _registrar registrar address
      * @param _chainIdOrigin origin chain id
      * @param _chainIdRemote remote chain id
      * @param _openSTRemote remote openSTUtility/openSTValue contract address
      */
     constructor(
        address _registrar,
        uint256 _chainIdOrigin,
        uint256 _chainIdRemote,
        address _openSTRemote,
        WorkersInterface _workers)
        Core(_registrar, _chainIdOrigin, _chainIdRemote, _openSTRemote, _workers) public { }

     /**
       *  @notice public view function getStorageRoot.
       *
       *  @dev this is for testing only.
       *
       *  @param _blockHeight block height for which storage root is needed.
       *
       *  @return bytes32 storage root
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
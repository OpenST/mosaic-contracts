pragma solidity ^0.4.23;

/**
 * @title MockGatewayLib contract
 *
 * @notice Used for test only
 */
library MockGatewayLib {


    /**
     *	@notice Mock Merkle proof verification of account.
     *
     *	@param _rlpEncodedAccount rlp encoded data of account.
     *	@param _rlpParentNodes path from root node to leaf in merkle tree.
     *	@param _encodedPath encoded path to search account node in merkle tree.
     *	@param _stateRoot state root for given block height.
     *
     *	@return bytes32 Storage path of the variable
     */
    function proveAccount(
        bytes _rlpEncodedAccount,
        bytes _rlpParentNodes,
        bytes _encodedPath,
        bytes32 _stateRoot
    )
    external
    pure
    returns (bytes32 storageRoot_)
    {
       return bytes32(0x8c0ee0843488170879578464b1cadcdb7377efa787372405ff373e4cec6a56db);
    }
}

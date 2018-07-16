pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";
import "./util.sol";

/**
 *	@title This contract is a mock contract for MerklePatriciaProof library contract
 *
 *	@notice It passes the parameters which it receives from test cases
 *
 */
contract MerklePatriciaProofMock is Util{


    /**
     * @notice This method is used for Account proof
     *
     * @param value The terminating value in the trie
     * @param encodedPath The path in the trie leading to value
     * @param rlpParentNodes The rlp encoded stack of nodes
     * @param root The root hash of the trie
     *
     * @return The boolean validity of the proof
     */
    function verifyAccount(
        bytes32 value,
        bytes encodedPath,
        bytes rlpParentNodes,
        bytes32 root)
        external
        pure
        returns (bool)
    {
        bytes memory encodedPathToBytes = bytes32ToBytes(keccak256(encodedPath));
        return MerklePatriciaProof.verify(value,encodedPathToBytes,rlpParentNodes,root);
    }

    /**
     * @notice This method is used for Storage proof
     *
     * @param value The terminating value in the trie
     * @param encodedPath The path in the trie leading to value
     * @param rlpParentNodes The rlp encoded stack of nodes
     * @param root The root hash of the trie
     *
     * @return The boolean validity of the proof
     */
    function verifyStorage(
        bytes32 value,
        bytes encodedPath,
        bytes rlpParentNodes,
        bytes32 root)
        external
        pure
        returns (bool)
    {
        return MerklePatriciaProof.verify(value,encodedPath,rlpParentNodes,root);
    }
}

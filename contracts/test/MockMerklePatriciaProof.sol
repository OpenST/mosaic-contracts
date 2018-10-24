pragma solidity ^0.4.23;

/**
 * @title MerklePatriciaVerifier
 * @author Sam Mayo (sammayo888@gmail.com)
 *
 * @dev Library for mocking merkle patricia proofs.
 */

library MockMerklePatriciaProof {
    /**
     * @dev Mock for merkle patricia proof verifier.
     * @param value The terminating value in the trie.
     * @param encodedPath The path in the trie leading to value.
     * @param rlpParentNodes The rlp encoded stack of nodes.
     * @param root The root hash of the trie.
     * @return The boolean validity of the proof.
     */
    function verify(
        bytes32 value,
        bytes encodedPath,
        bytes rlpParentNodes,
        bytes32 root
    )
        external
        pure
        returns (bool)
    {
        return true;
    }

}

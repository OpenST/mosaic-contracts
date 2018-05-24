pragma solidity ^0.4.23;


import "./MerklePatriciaProof.sol";
import "./util.sol";

contract VerifyProof is Util {

    function accountInState(bytes32 value, bytes path, bytes rlpParentNodes, bytes32 root) public returns(bool) {

        bool isProofVerified = MerklePatriciaProof.verify(value, bytes32ToBytes(keccak256(path)), rlpParentNodes, root);
        return isProofVerified;
    }

    function storageInAccount(bytes32 value, bytes path, bytes rlpParentNodes, bytes32 root) public returns(bool) {

        bool isProofVerified = MerklePatriciaProof.verify(value, path, rlpParentNodes, root);
        return isProofVerified;
    }
}

pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";
import "./util.sol";
contract MerklePatriciaProofMock is Util{



    function verify(bytes32 value, address encodedPath, bytes rlpParentNodes, bytes32 root) returns (bool){


        bytes memory encodedPathToBytes = bytes32ToBytes(keccak256(encodedPath));
        return MerklePatriciaProof.verify(value,encodedPathToBytes,rlpParentNodes,root);





    }



}
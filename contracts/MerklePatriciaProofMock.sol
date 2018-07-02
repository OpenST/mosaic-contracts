pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";
import "./util.sol";
contract MerklePatriciaProofMock is Util{

    function MerklePatriciaProofMock(){

    }



    function verifyAccount(bytes32 value, bytes encodedPath, bytes rlpParentNodes, bytes32 root) returns (bool){


        bytes memory encodedPathToBytes = bytes32ToBytes(keccak256(encodedPath));
        return MerklePatriciaProof.verify(value,encodedPathToBytes,rlpParentNodes,root);


    }
    function verifyStorage(bytes32 value, bytes encodedPath, bytes rlpParentNodes, bytes32 root) returns (bool){


        //bytes memory encodedPathToBytes = bytes32ToBytes(keccak256(encodedPath));
        return MerklePatriciaProof.verify(value,encodedPath,rlpParentNodes,root);


    }



}

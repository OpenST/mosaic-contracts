
pragma solidity ^0.4.23;

import "./RLP.sol";
import "./util.sol";

contract MerklePatriciaProof is Util{

    event TestEvent(uint location, uint index);

    /*
     * @dev Verifies a merkle patricia proof.
     * @param value The terminating value in the trie.
     * @param encodedPath The path in the trie leading to value.
     * @param rlpParentNodes The rlp encoded stack of nodes.
     * @param root The root hash of the trie.
     * @return The boolean validity of the proof.
     */
    function verify(bytes32 value, bytes addr, bytes rlpParentNodes, bytes32 root) public returns (bool) {

        //Convert back RLP encoded parent Nodes to list of Nodes
        RLP.RLPItem memory item = RLP.toRLPItem(rlpParentNodes);
        RLP.RLPItem[] memory parentNodes = RLP.toList(item);


        //Sha3 of account address - used from traversing from root to desired node
        bytes memory encodedPath = addr;//bytes32ToBytes(addr);//bytes32ToBytes(keccak256(addr));
        bytes memory currentNode;
        RLP.RLPItem[] memory currentNodeList;

        bytes32 nodeKey = root;
        uint pathPtr = 0;

        bytes memory path = _getNibbleArray2(encodedPath);
        if (path.length == 0) {
            emit TestEvent(0, 11);

            return false;
        }


        for (uint i = 0; i < parentNodes.length; i++) {
            if (pathPtr > path.length) {
                emit TestEvent(0, 12);
                return false;
            }

            currentNode = RLP.toBytes(parentNodes[i]);

            //            //check address key for each node should be equal to sha3 of node
            if (nodeKey != keccak256(currentNode)) {
                emit TestEvent(i, 0);
                return false;
            }

            currentNodeList = RLP.toList(parentNodes[i]);

            //            //check if node is branch node
            if (currentNodeList.length == 17) {
                //
                //check if whole path is traversed and reached to desired node
                if (pathPtr == path.length) {
                    //check if value of node is same as expected account value
                    if (keccak256(RLP.toBytes(currentNodeList[16])) == value) {
                        emit TestEvent(i, 1);
                        return true;
                    } else {
                        emit TestEvent(i, 2);
                        return false;
                    }
                }

                uint8 nextPathNibble = uint8(path[pathPtr]);
                if (nextPathNibble > 16) {
                    emit TestEvent(i, 3);
                    return false;
                }

                //                //select  next node key from branch
                nodeKey = RLP.toBytes32(currentNodeList[nextPathNibble]);
                pathPtr += 1;
                emit TestEvent(10, 10);
                //
            }

            else if (currentNodeList.length == 2) {// check if node is extension or leaf node
                pathPtr += _nibblesToTraverse(RLP.toData(currentNodeList[0]), path, pathPtr);

                if (pathPtr == path.length) {//leaf node
                    //check if value of node is same as expected account value
                    if (keccak256(RLP.toData(currentNodeList[1])) == value) {
                        emit TestEvent(i, 4);
                        return true;
                    } else {
                        emit TestEvent(i, 5);
                        return false;
                    }
                }

                //extension node ... test if means that it is empty value
                if (_nibblesToTraverse(RLP.toData(currentNodeList[0]), path, pathPtr) == 0) {
                    emit TestEvent(i, 6);
                    return (keccak256() == value);
                }
                //select next node key which is value of extension node
                nodeKey = RLP.toBytes32(currentNodeList[1]);
            } else {
                emit TestEvent(i, 7);
                return false;
            }
        }
    }


    function _nibblesToTraverse(bytes encodedPartialPath, bytes path, uint pathPtr) private pure returns (uint) {
        uint len;
        // encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
        // and slicedPath have elements that are each one hex character (1 nibble)
        bytes memory partialPath = _getNibbleArray(encodedPartialPath);
        bytes memory slicedPath = new bytes(partialPath.length);

        // pathPtr counts nibbles in path
        // partialPath.length is a number of nibbles
        for(uint i=pathPtr; i<pathPtr+partialPath.length; i++) {
            byte pathNibble = path[i];
            slicedPath[i-pathPtr] = pathNibble;
        }

        if(keccak256(partialPath) == keccak256(slicedPath)) {
            len = partialPath.length;
        } else {
            len = 0;
        }
        return len;
    }

    // bytes b must be hp encoded
    function _getNibbleArray(bytes b) private pure returns (bytes) {
        bytes memory nibbles;
        if(b.length>0) {
            uint8 offset;
            uint8 hpNibble = uint8(_getNthNibbleOfBytes(0,b));
            if(hpNibble == 1 || hpNibble == 3) {
                nibbles = new bytes(b.length*2-1);
                byte oddNibble = _getNthNibbleOfBytes(1,b);
                nibbles[0] = oddNibble;
                offset = 1;
            } else {
                nibbles = new bytes(b.length*2-2);
                offset = 0;
            }

            for(uint i=offset; i<nibbles.length; i++) {
                nibbles[i] = _getNthNibbleOfBytes(i-offset+2,b);
            }
        }
        return nibbles;
    }

    // normal byte array, no encoding used
    function _getNibbleArray2(bytes b) private pure returns (bytes) {
        bytes memory nibbles = new bytes(b.length*2);
        for (uint i = 0; i < nibbles.length; i++) nibbles[i] = _getNthNibbleOfBytes(i, b);
        return nibbles;
    }

    function _getNthNibbleOfBytes(uint n, bytes str) private pure returns (byte) {
        return byte(n%2==0 ? uint8(str[n/2])/0x10 : uint8(str[n/2])%0x10);
    }
}

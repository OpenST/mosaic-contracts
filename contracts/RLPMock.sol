pragma solidity ^0.4.23;

import "./RLP.sol";

contract RLPMock  {
    function RLPMock(){

    }

    RLP.RLPItem public rlpO;


    function toRLP(bytes memory rlpParentNodes) public {

        RLP.RLPItem memory rlpItem = toRLPItem(rlpParentNodes);
        rlpO = rlpItem;
    }

    function toRLPItem(bytes memory rlpParentNodes) internal pure returns (RLP.RLPItem memory item){

        item = RLP.toRLPItem(rlpParentNodes);
        return item;


    }


}

pragma experimental ABIEncoderV2;

import "./RLP.sol";

contract RLPMock  {
    function RLPMock(){

    }

    /** @notice Creates an RLPItem from an array of RLP encoded bytes.
     *
     *  @param rlpParentNodes The RLP encoded bytes.
     *
     *  @return length and memory pointer of the rlp.
     */
    function toRLPItem(bytes memory rlpParentNodes) public returns(uint,uint){

        RLP.RLPItem memory item = RLP.toRLPItem(rlpParentNodes);
        return (item._unsafe_length,item._unsafe_memPtr);


    }

    /**  @notice Creates an RLPItem from an array of RLP encoded bytes.
     *
     *   @param rlpParentNodes The RLP encoded bytes.
     *   @param strict Will throw if the data is not RLP encoded.
     *
     *   @return An RLPItem
     */
    function toRLPItemStrict(
        bytes memory rlpParentNodes,
        bool strict)
    public returns(uint, uint){

        RLP.RLPItem memory item = RLP.toRLPItem(rlpParentNodes,strict);
        return(item._unsafe_length,item._unsafe_memPtr);

    }


    /** @notice Get the list of sub-items from an RLP encoded list.
     * Warning: This is inefficient, as it requires that the list is read twice.
     *
     * @param rlpEncodedData The RLP encoded bytes.
     *
     * @return length of list.
     */
    function toList(bytes memory rlpEncodedData) public returns(uint) {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        RLP.RLPItem[] memory list =  RLP.toList(item);
        return list.length;


    }

    /**  @notice Decode an RLPItem into a bytes32. This will not work if the RLPItem is a list.
     *
     *    @param rlpEncodedData The RLPItem encoded bytes.
     *
     *    @return The decoded string.
     */
    function toBytes(bytes memory rlpEncodedData) public returns(bytes toBytes){

        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData,true);

        toBytes= RLP.toBytes(item);

    }

    /**  @notice Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
     *
     *  @param rlpEncodedData The RLPItem encoded bytes.
     *
      *  @return The decoded string in bytes format.
     */
    function toData(bytes memory rlpEncodedData) public returns(bytes toData){

        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        toData = RLP.toData(item);

    }


}

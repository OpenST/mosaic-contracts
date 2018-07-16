pragma solidity ^0.4.23;
import "./RLP.sol";


/**
 *	@title RLPTest contract is for RLP library contract
 *
 *	@notice It is used to test methods in RLP library contract
 */
contract RLPTest  {


    /**
     *  @notice Creates an RLPItem from an array of RLP encoded bytes.
     *
     *  @param rlpEncodedData The RLP encoded bytes.
     *
     *  @return length of the rlp data.
     *  @return memory pointer at which rlp data is present.
     */
    function toRLPItem(bytes rlpEncodedData)
        public
        pure
        returns
        (uint /* length */,
        uint /* memory_pointer */)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        return (item._unsafe_length,item._unsafe_memPtr);
    }

    /**
     *   @notice Creates an RLPItem from an array of RLP encoded bytes having.
     *
     *   @param rlpEncodedData The RLP encoded bytes.
     *   @param strict Will throw if the data is not RLP encoded.
     *
     *   @return length of the rlp data.
     *   @return memory pointer at which rlp data is present.
     */
    function toRLPItemStrict(
        bytes rlpEncodedData,
        bool strict)
        public
        pure
        returns(
        uint /* length */,
        uint /* memory_pointer */)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData,strict);
        return(item._unsafe_length,item._unsafe_memPtr);
    }


    /**
     * @notice Get the list of sub-items from an RLP encoded list.
     * Warning: This is inefficient, as it requires that the list is read twice.
     *
     * @param rlpEncodedData The RLP encoded bytes.
     *
     * @return length of list.
     */
    function toList(
        bytes rlpEncodedData)
        public
        pure
        returns(uint)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        RLP.RLPItem[] memory list =  RLP.toList(item);
        return list.length;
    }

    /**  @notice Decode an RLPItem into a bytes32. This will not work if the RLPItem is a list.
     *
     *   @param rlpEncodedData The RLPItem encoded bytes.
     *
     *    @return toBytes decoded value in the form of bytes.
     */
    function toBytes(
        bytes rlpEncodedData)
        public
        pure
        returns(bytes)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        return RLP.toBytes(item);
    }

    /**
     *  @notice Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
     *
     *  @param rlpEncodedData The RLPItem encoded bytes.
     *
     *  @return toData The decoded string in bytes format.
     */
    function toData(
        bytes rlpEncodedData)
        public
        pure
        returns(bytes)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        return RLP.toData(item);
    }
}

pragma solidity ^0.4.23;
import "./RLP.sol";


/**
 *  @title RLPTest contract is for RLP library contract
 *
 *  @notice It is used to test methods in RLP library contract
 */
contract RLPTest  {

    /**
      * @notice Creates an RLPItem from an array of RLP encoded bytes.
      *
      * @param rlpEncodedData The RLP encoded bytes.
      *
      * @return memory pointer at which rlp data is present.
      * @return length of the rlp data.
      */
    function toRLPItem(bytes rlpEncodedData)
        public
        pure
        returns(
        uint /* memory_pointer */,
        uint /* length */)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        return (item._unsafe_memPtr,item._unsafe_length);
    }

    /**
      * @notice Get the list of sub-items from an RLP encoded list.
      * Warning: This is inefficient, as it requires that the list is read twice.
      *
      * @param rlpEncodedData The RLP encoded bytes.
      * @param index The position in the input array of which data is returned
      *
      * @return data kept at index.
      * @return length of list.
      */
    function toList(
        bytes rlpEncodedData,
        uint256 index)
        public
        pure
    returns (bytes data, uint256 length)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        RLP.RLPItem[] memory list =  RLP.toList(item);

        length = list.length;
        if (index < length)
            data = RLP.toData(list[index]);
    }

    /** @notice Decode an RLPItem into a bytes32. This will not work if the RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes.
      *
      * @return toBytes decoded value in the form of bytes.
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
      * @notice Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes.
      *
      * @return toData The decoded string in bytes format.
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

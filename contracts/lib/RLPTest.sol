pragma solidity ^0.5.0;
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
    function toRLPItem(
        bytes memory rlpEncodedData
    )
        public
        pure
        returns(uint memoryPointer_, uint length_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        memoryPointer_ = item._unsafe_memPtr;
        length_ = item._unsafe_length;
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
        bytes memory rlpEncodedData,
        uint256 index
    )
        public
        pure
        returns (bytes memory data_, uint256 length_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        RLP.RLPItem[] memory list = RLP.toList(item);

        length_ = list.length;
        if (index < length_) {
            data_ = RLP.toData(list[index]);
        }
    }

    /**
     *@notice Decode an RLPItem into a bytes32. This will not work if the RLPItem is a list.
     *
     * @param rlpEncodedData The RLPItem encoded bytes.
     *
     * @return toBytes decoded value in the from of bytes.
     */
    function toBytes(
        bytes memory rlpEncodedData
    )
        public
        pure
        returns(bytes memory bytes_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        bytes_ = RLP.toBytes(item);
    }

    /**
      * @notice Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes.
      *
      * @return toData The decoded string in bytes format.
      */
    function toData(
        bytes memory rlpEncodedData
    )
        public
        pure
        returns(bytes memory bytes_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        bytes_ = RLP.toData(item);
    }
}

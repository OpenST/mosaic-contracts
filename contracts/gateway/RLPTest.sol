pragma solidity ^0.4.23;
import "./RLP.sol";


/**
 *  @title RLPTest contract is for RLP library contract
 *
 *  @notice It is used to test methods in RLP library contract
 */
contract RLPTest  {

    /**
      * @notice Get the next RLP subitem from iterator. 
      *
      * @param rlpEncodedData The RLP encoded bytes.
      * @param strict Boolean representing input RLP encoding.
      *
      * @return memory pointer at which rlp data is present.
      * @return length of the rlp data.
      */
    function nextStrict(bytes rlpEncodedData, bool strict)
        public
        pure
        returns(
        uint /* memory_pointer */,
        uint /* length */)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        RLP.Iterator memory iter = RLP.iterator(item);
        RLP.RLPItem memory subItem = RLP.next(iter, strict);
        return (subItem._unsafe_memPtr, subItem._unsafe_length);
    }

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
      * @notice Creates an RLPItem from an array of RLP encoded bytes.
      *
      * @param rlpEncodedData The RLP encoded bytes.
      * @param strict Bool.
      *
      * @return memory pointer at which rlp data is present.
      * @return length of the rlp data.
      */
    function toRLPItemStrict(bytes rlpEncodedData, bool strict)
        public
        pure
        returns(
        uint /* memory_pointer */,
        uint /* length */)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData, strict);
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

    /**
      * @notice Check if the RLP item is null.
      *
      * @param rlpEncodedData The RLPItem encoded bytes.
      *
      * @return 'true' if the item is null.
      */
    function isNull(
        bytes rlpEncodedData)
        public
        pure
        returns(bool ret)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        ret = RLP.isNull(item);
        return ret;
    }

    /**
      * @notice Check if the RLP item is empty (string or list).
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return 'true' if the item is null.
      */
    function isEmpty(
        bytes rlpEncodedData)
        public
        pure
        returns (bool ret)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        ret = RLP.isEmpty(item);
        return ret;
    }

    /**
      * @notice Decode an RLPItem into an ascii string. This will not work if the
      *         RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return The decoded string.
      */
    function toAscii(
        bytes rlpEncodedData)
        public
        pure
        returns (string str)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        str = RLP.toAscii(item);
        return str;
    }

    /**
      * @notice Decode an RLPItem into a boolean. This will not work if the
      *         RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return The decoded boolean string.
      */
    function toBool(
        bytes rlpEncodedData)
        public
        pure
        returns (bool data)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData); 
        data = RLP.toBool(item);
        return data;
    }

    /**
      * @notice Decode an RLPItem into a byte. This will not work if the
      *         RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return The decoded byte string.
      */
    function toByte(
        bytes rlpEncodedData)
        public
        pure
        returns (byte data)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        data = RLP.toByte(item);
        return data;
    }

    /**
      * @notice Decode an RLPItem into an int. This will not work if the
      *         RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return The decoded integer string.
      */
    function toInt(
        bytes rlpEncodedData)
        public
        pure
        returns (int data)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        data = RLP.toInt(item);
        return data;
    }

    /**
      * @notice Decode an RLPItem into an address. This will not work if the
      *          RLPItem is a list.
      *
      * @param rlpEncodedData The RLPItem encoded bytes. 
      *
      * @return The decoded address string.
      */
    function toAddress(
        bytes rlpEncodedData)
        public
        pure
        returns (address data)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpEncodedData);
        data = RLP.toAddress(item);
        return data;
    }
}

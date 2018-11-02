pragma solidity ^0.4.23;

contract MockProofResults {

    /** A mapping of hashes to their results. */
    mapping (bytes32 => bool) results;


    function setResult (
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root,
        bool _result
    )
        external
        returns (bool isSuccess_)
    {

        bytes32 resultHash = hash(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );

        results[resultHash] = _result;

        isSuccess_ = true;

    }

    function verify(
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root
    )
        external
        view
        returns (bool)
    {

        bytes32 resultHash = hash(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );

        return results[resultHash];
    }


    function hash(
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root
    )
        private
        returns (bytes32 resultHash_)
    {
        resultHash_ =  keccak256(
            abi.encodePacked(
                _value,
                _encodedPath,
                _rlpParentNodes,
                _root
            )
        );
    }
}

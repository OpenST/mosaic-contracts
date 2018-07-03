pragma solidity ^0.4.0;

import "./OpenSTUtils.sol";

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";
import "./RLP.sol";
import "./Hasher.sol";


contract Mock is Hasher {

    constructor(){}

    function temp1(
        uint8 _intentIndex,
        address _address,
        uint256 _addressNonce)
    external
    pure
    returns (bytes32 /* verification status */)
    {
        return OpenSTUtils.temp1(_intentIndex, _address, _addressNonce);
    }

    function makeKey(
        address _address,
        uint256 _addressNonce)
    external
    pure
    returns (bytes32 /* verification status */)
    {
        return keccak256(_address, _addressNonce);
    }

    function storagePath(
        uint8 _index,
        bytes32 _key)
        external
        pure
        returns(bytes32 /* storage path */)
    {
        return OpenSTUtils.storagePath(_index, _key);
    }

    function verifyIntentStorage(
        uint8 _intentIndex,
        address _address,
        uint256 _addressNonce,
        bytes32 _storageRoot,
        bytes32 _intentHash,
        bytes _rlpParentNodes)
        external
        pure
        returns (bool /* verification status */)
    {
        require(OpenSTUtils.verifyIntentStorage(
                _intentIndex,
                _address,
                _addressNonce,
                _storageRoot,
                _intentHash,
                _rlpParentNodes));

        return true;
    }

    function verifyDebugIntentStorage(
        uint8 _intentIndex,
        address _address,
        uint256 _addressNonce,
        bytes32 _storageRoot,
        bytes32 _intentHash,
        bytes _rlpParentNodes)
    external
    pure
    returns (bool res, uint loc, bytes path_debug /* verification status */)
    {
        return OpenSTUtils.verifyDebugIntentStorage(
            _intentIndex,
            _address,
            _addressNonce,
            _storageRoot,
            _intentHash,
            _rlpParentNodes);
    }

    function getPath(
        uint8 _intentIndex,
        address _address,
        uint256 _addressNonce,
        bytes32 _storageRoot,
        bytes32 _intentHash,
        bytes _rlpParentNodes)
    external
    pure
    returns (bytes32, bytes , bytes32/* verification status */)
    {
        return OpenSTUtils.getPath(
            _intentIndex,
            _address,
            _addressNonce,
            _storageRoot,
            _intentHash,
            _rlpParentNodes);
    }



    function createData(
        bytes32 _uuid,
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amountUT,
        uint256 _redemptionUnlockHeight,
        bytes32 _hashLock)
    external
    returns (
        bytes32 intentHash,
        bytes32 intentKey)
    {

        intentHash = hashRedemptionIntent(
            _uuid,
            _redeemer,
            _redeemerNonce,
            _beneficiary,
            _amountUT,
            _redemptionUnlockHeight,
            _hashLock
        );

        intentKey = hashIntentKey(_redeemer, _redeemerNonce);

    }
}

pragma solidity ^0.4.23;

import "../../core/BlockStoreInterface.sol";

contract MockPollingPlace {

    BlockStoreInterface public auxiliaryBlockStore;

    function setAuxiliaryBlockStore(BlockStoreInterface _auxiliaryBlockStore)
        external
    {
        auxiliaryBlockStore = _auxiliaryBlockStore;
    }

    function updateMetaBlockHeight(
        address[] _validators,
        uint256[] _weights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        external
        pure
        returns (bool success_)
    {
        success_ = true;
    }


    function justify(
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        external
    {
        auxiliaryBlockStore.justify(_sourceBlockHash, _targetBlockHash);
    }

}

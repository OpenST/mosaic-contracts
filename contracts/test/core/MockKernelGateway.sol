pragma solidity ^0.4.23;

import "../../core/KernelGateway.sol";
import "../MockProofResults.sol";

contract MockKernelGateway is KernelGateway{

    MockProofResults mockResult;

    constructor (
        address _originCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore,
        bytes32 _kernenlHash
    )
        KernelGateway(
            _originCore,
            _originBlockStore,
            _auxiliaryBlockStore,
            _kernenlHash
        )
        public
    {
        mockResult = new MockProofResults();
    }

    function setResult (
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root,
        bool _result
    )
        external
    {
        mockResult.setResult(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root,
            _result
        );
    }

    function verify(
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root
    )
        internal
        view
        returns (bool success_)
    {
        success_ =  mockResult.verify(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );
    }

    function setOpenKernelHash(bytes32 _kernelHash) external {
        openKernelHash = _kernelHash;
    }

    function setOpenKernelActivationHeight(uint256 _activationHeight) external {
        openKernelActivationHeight = _activationHeight;
    }

    function setKernel(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights,
        bytes32 _kernelHash
    )
        external
    {
        kernels[_kernelHash] = MetaBlock.Kernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );
    }

}

import "../../core/KernelGateway.sol";
import "../MockProofResults.sol";

pragma solidity ^0.4.23;

contract MockKernelGateway is KernelGateway{

    MockProofResults mockResult;

    constructor (
        address _originCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore
    )
        KernelGateway(
            _originCore,
            _originBlockStore,
            _auxiliaryBlockStore
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

    function setOpenKernel(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights
    )
        external
    {
        openKernel = MetaBlock.Kernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        openKernelHash = MetaBlock.hashKernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );
    }

}

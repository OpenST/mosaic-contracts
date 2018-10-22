pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import "../OstInterface.sol";
import "./OriginCoreConfig.sol";
import "./OriginCoreInterface.sol";
import "./Stake.sol";
import "../lib/MetaBlock.sol";

/**
 * @title OriginCore is a meta-blockchain with staked validators on Ethereum.
 */
contract OriginCore is OriginCoreInterface, OriginCoreConfig {

    /* Events */

    /** Emitted whenever a block is successfully reported. */
    event BlockReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /** Emitted whenever a meta-block is proposed. */
    event BlockProposed(
        uint256 indexed height,
        bytes32 indexed kernelHash,
        bytes32 transitionHash
    );
    /* Public Variables */

    OstInterface public Ost;

    bytes32 public auxiliaryCoreIdentifier;

    /** The stake contract address. */
    StakeInterface public stake;
    /** Height of the open block. */
    uint256 public height;

    /** head is the block header hash of the latest committed block. */
    bytes32 public head;

    /**
     * Mapping of block hashes to block headers that were reported with the
     * respective hash.
     */
    mapping (bytes32 => MetaBlock.Header) public reportedHeaders;

    /**
     * Mapping of kernel hash to transition object map.
     * where transition object map is transition hash to transition mapping.
     */
    mapping(bytes32 => mapping(bytes32 => MetaBlock.AuxiliaryTransition)) public proposedMetaBlock;

    /* Constructor */

    /**
     * @param _auxiliaryCoreIdentifier The core identifier of the auxiliary
     *                        chain that this core contract tracks.
     * @param _ost The address of the OST ERC-20 token.
     * @param _initialValidators The array of addresses of the validators.
     * @param _validatorsWeights The array of weights that corresponds to
     *                        the updated validators.
     */
    constructor(
        bytes32 _auxiliaryCoreIdentifier,
        address _ost,
        address[] _initialValidators,
        uint256[] _validatorsWeights
    )
        public
    {
        require(_ost != address(0), "Address for OST should not be zero.");

        auxiliaryCoreIdentifier = _auxiliaryCoreIdentifier;
        Ost = OstInterface(_ost);

        // deploy stake contract
        stake = new Stake(
            _ost,
            address(this),
            _initialValidators,
            _validatorsWeights
        );
        head = reportGenesisBlock(_initialValidators, _validatorsWeights);
    }

    /* External Functions */

    /**
     * @notice Proposes a new meta-block. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _height Height of the meta-block in the chain of meta-blocks.
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _kernelHash The hash of the current kernel.
     * @param _auxiliaryDynasty The dynasty number where the meta-block closes
     *                          on the auxiliary chain.
     * @param _auxiliaryBlockHash The block hash where the meta-block closes
     *                          on the auxiliary chain.
     * @param _gas The total consumed gas on auxiliary within this meta-block.
     * @param _originDynasty Dynasty of origin block within latest meta-block
     *                          reported at auxiliary chain.
     * @param _originBlockHash Block hash of origin block within latest
     *                          meta-block reported at auxiliary chain.
     * @param _transactionRoot The transaction root of the meta-block. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @param _stateRoot The state root of the last finalised checkpoint
     *                            that is part of this meta-block.
     * @return `true` if the proposal succeeds.
     */
    function proposeBlock(
        uint256 _height,
        bytes32 _coreIdentifier,
        bytes32 _kernelHash,
        uint256 _auxiliaryDynasty,
        bytes32 _auxiliaryBlockHash,
        uint256 _gas,
        uint256 _originDynasty,
        bytes32 _originBlockHash,
        bytes32 _transactionRoot,
        bytes32 _stateRoot
    )
        external
        returns (bool success_)
    {

        require(
            _kernelHash != bytes32(0),
            'Kernel hash should not be `0`.'
        );

        require(
            _originDynasty > 0,
            'Kernel hash should not be `0`.'
        );

        require(
            _originBlockHash != bytes32(0),
            'Kernel hash should not be `0`.'
        );

        require(
            _transactionRoot != bytes32(0),
            'Transaction Root hash should not be `0`.'
        );

        require(
            _stateRoot != bytes32(0),
            'State Root should not be `0`.'
        );

        require(
            _coreIdentifier == auxiliaryCoreIdentifier,
            'CoreIdentifier should be same as auxiliary core identifier.'
        );

        /* header of last meta block */
        MetaBlock.Header memory latestMetaBlockHeader = reportedHeaders[head];

        require(
            latestMetaBlockHeader.transition.kernelHash != bytes32(0),
            'Last meta-block should be defined.'
        );

        require(
            latestMetaBlockHeader.kernel.height + 1 == height,
            'Height should be one more than last meta-block.'
        );

        require(
            _auxiliaryDynasty > latestMetaBlockHeader.transition.auxiliaryDynasty,
            'Auxiliary dynasty should be greater than last meta-block auxiliary dynasty.'
        );

        require(
            _gas > latestMetaBlockHeader.transition.gas,
            'Gas consumed should be greater than last meta-block gas.'
        );


        bytes32 transitionHash = MetaBlock.hashAuxiliaryTransition(
            _coreIdentifier,
            _kernelHash,
            _auxiliaryDynasty,
            _auxiliaryBlockHash,
            _gas,
            _originDynasty,
            _originBlockHash,
            _transactionRoot,
            _stateRoot
        );
        require(
            proposedMetaBlock[_kernelHash][transitionHash].kernelHash == bytes32(0),
            "Meta-block with same transition object is already proposed."
        );

        proposedMetaBlock[_kernelHash][transitionHash] = MetaBlock.AuxiliaryTransition(
            _coreIdentifier,
            _kernelHash,
            _auxiliaryDynasty,
            _auxiliaryBlockHash,
            _gas,
            _originDynasty,
            _originBlockHash,
            _transactionRoot,
            _stateRoot
        );
        emit BlockProposed(height, _kernelHash, transitionHash);

        return true;
    }

    /**
     * @notice Verifies a vote that justified the direct child checkpoint of
     *         the last justified auxiliary checkpoint in the meta-block. A
     *         supermajority of such votes finalise the last auxiliary
     *         checkpoint of this meta-block.
     *
     * @dev Must track which votes have already been verified so that the same
     *      vote never gets verified more than once.
     *
     * @param _metaBlockHash The block hash of the meta-block for which the
     *                       votes shall be verified.
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transition The hash of the transition part of the meta-block
     *                    header at the source block.
     * @param _source The hash of the source block.
     * @param _target The hash of the target block.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return `true` if the verification succeeded.
     */
    function verifyVote(
        bytes32 _metaBlockHash,
        bytes20 _coreIdentifier,
        bytes32 _transition,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        external
        returns (bool success_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice The identifier of the remote chain core that is tracked by this core.
     *
     * @return The identifier of auxiliary core.
     */
    function auxiliaryCoreIdentifier()
        external
        view
    returns (bytes32)
    {
        return auxiliaryCoreIdentifier;
    }

    /**
     * @notice Returns the block height of the latest meta-block that has been
     *         committed.
     *
     * @dev A meta-block has been committed if it has been proposed and the
     *      votes have been verified.
     *
     * @return The height of the latest committed meta-block.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256)
    {
        /*
         * `height` is the current open meta-block. The latest committed block
         * is therefore at `height - 1`.
         */
        return height - 1;
    }

    /**
     * @notice Get the state root of a meta-block.
     *
     * @param _blockHeight For which blockheight to get the state root.
     *
     * @return The state root of the meta-block.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice private method to create genesis block.
     *
     * @param _initialValidators initial validators addresses.
     * @param _validatorsWeights initial validators weights.
     *
     * @return bytes32 head of meta-block chain pointing to genesis block.
     */
    function reportGenesisBlock(
        address[] _initialValidators,
        uint256[] _validatorsWeights
    )
        private
        returns (bytes32)
    {
       /*
        * Kernel for genesis block with height 0, no parent block and
        * initial set of validators with their weights.
        */
        MetaBlock.Kernel memory genesisKernel = MetaBlock.Kernel(
            0,
            bytes32(0),
            _initialValidators,
            _validatorsWeights
        );
        bytes32 kernelHash = MetaBlock.hashKernel(
            0,
            bytes32(0),
            _initialValidators,
            _validatorsWeights
        );
        /*
         * Transition object for genesis block with all parameter as 0 except
         * auxiliaryCoreIdentifier and kernel Hash.
         */
        MetaBlock.AuxiliaryTransition memory genesisTransition = MetaBlock.AuxiliaryTransition(
            auxiliaryCoreIdentifier,
            kernelHash,
            0,
            bytes32(0),
            0,
            0,
            bytes32(0),
            bytes32(0),
            bytes32(0)
        );

        reportedHeaders[kernelHash] = MetaBlock.Header(genesisKernel, genesisTransition);

        return kernelHash;
    }
}

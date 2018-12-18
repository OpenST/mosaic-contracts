pragma solidity ^0.5.0;



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
//

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";
import "./SafeMath.sol";

library GatewayLib {
    using SafeMath for uint256;

    /**
     * @notice Calculate the fee amount which is rewarded to facilitator for
     *         performing message transfers.
     *
     * @param _gasConsumed gas consumption during message confirmation.
     * @param _gasLimit maximum amount of gas can be used for reward.
     * @param _gasPrice price at which reward is calculated
     * @param _initialGas initial gas at the start of the process
     * @param _estimatedAdditionalGasUsage Estimated gas that will be used
     *
     * @return fee amount
     * @return totalGasConsumed_ total gas consumed during message transfer
     */
    function feeAmount(
        uint256 _gasConsumed,
        uint256 _gasLimit,
        uint256 _gasPrice,
        uint256 _initialGas,
        uint256 _estimatedAdditionalGasUsage
    )
        external
        view
        returns (
            uint256 fee_,
            uint256 totalGasConsumed_
        )
    {
        totalGasConsumed_ = _initialGas.sub(
            gasleft()

        ).add(
            _estimatedAdditionalGasUsage
        ).add(
            _gasConsumed
        );

        if (totalGasConsumed_ < _gasLimit) {
            fee_ = totalGasConsumed_.mul(_gasPrice);
        } else {
            fee_ = _gasLimit.mul(_gasPrice);
        }
    }

    /**
     * @notice Get the storage path of the variable
     *
     * @param _index Index of variable
     * @param _key Key of variable incase of mapping
     *
     * @return bytes32 Storage path of the variable
     */
    function storageVariablePath(
        uint8 _index,
        bytes32 _key
    )
        external
        pure
        returns (bytes32 /* storage path */)
    {
        bytes memory indexBytes = BytesLib.leftPad(
            bytes32ToBytes(
                bytes32(uint256(_index))
            )
        );
        bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
        bytes memory path = BytesLib.concat(keyBytes, indexBytes);
        return keccak256(abi.encodePacked(keccak256(abi.encodePacked(path))));
    }

    /**
     * @notice Merkle proof verification of account.
     *
     * @param _rlpAccount rlp encoded data of account.
     * @param _rlpParentNodes path from root node to leaf in merkle tree.
     * @param _encodedPath encoded path to search account node in merkle tree.
     * @param _stateRoot state root for given block height.
     *
     * @return bytes32 Storage path of the variable
     */
    function proveAccount(
        bytes calldata _rlpAccount,
        bytes calldata _rlpParentNodes,
        bytes calldata _encodedPath,
        bytes32 _stateRoot
    )
        external
        pure
        returns (bytes32 storageRoot_)
    {
        // Decode RLP encoded account value
        RLP.RLPItem memory accountItem = RLP.toRLPItem(_rlpAccount);
        // Convert to list
        RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);
        // Array 3rd position is storage root
        storageRoot_ = RLP.toBytes32(accountArray[2]);
        // Hash the rlpValue value
        bytes32 hashedAccount = keccak256(
            abi.encodePacked(_rlpAccount)
        );

        /**
         * Verify the remote OpenST contract against the anchored state
         * root with the state trie Merkle proof
         */
        require(MerklePatriciaProof.verify(hashedAccount, _encodedPath,
            _rlpParentNodes, _stateRoot), "Account proof is not verified.");

        return storageRoot_;
    }

    /**
     * @notice  function to calculate stake intent hash.
     *
     * @param _amount stake amount.
     * @param _beneficiary mint account.
     * @param _staker staker address.
     * @param _stakerNonce nounce of staker.
     * @param _gasPrice price used for reward calculation.
     * @param _gasLimit max limit for reward calculation.
     * @param _token EIP20 token address used for stake.
     *
     * @return bytes32 stake intent hash
     */
    function hashStakeIntent(
        uint256 _amount,
        address _beneficiary,
        address _staker,
        uint256 _stakerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _token
    )
    external
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _amount,
                _beneficiary,
                _staker,
                _stakerNonce,
                _gasPrice,
                _gasLimit,
                _token
            )
        );
    }

    /**
     * @notice function to calculate redeem intent hash.
     *
     * @param _amount redeem amount
     * @param _beneficiary unstake account
     * @param _redeemer redeemer account
     * @param _redeemerNonce nonce of staker
     * @param _gasPrice price used for reward calculation
     * @param _gasLimit max limit for reward calculation
     * @param _token utility token address
     *
     * @return bytes32 redeem intent hash
     */
    function hashRedeemIntent(
        uint256 _amount,
        address _beneficiary,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _token
    )
    external
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _amount,
                _beneficiary,
                _redeemer,
                _redeemerNonce,
                _gasPrice,
                _gasLimit,
                _token
            )
        );
    }

    /**
     * @notice Convert bytes32 to bytes
     *
     * @param _inBytes32 bytes32 value
     *
     * @return bytes value
     */
    function bytes32ToBytes(bytes32 _inBytes32)
        public
        pure
        returns (bytes memory)
    {
        return BytesLib.bytes32ToBytes(_inBytes32);
    }
}

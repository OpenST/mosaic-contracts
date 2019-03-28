pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

library GatewayLib {

    /* Constants */

    bytes32 constant public STAKE_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "StakeIntent(uint256 amount,address beneficiary,address gateway)"
        )
    );

    bytes32 constant public REDEEM_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "RedeemIntent(uint256 amount,address beneficiary,address gateway)"
        )
    );


    /* External Functions */

    /**
     * @notice Merkle proof verification of account.
     *
     * @param _rlpAccount RLP encoded data of account.
     * @param _rlpParentNodes Path from root node to leaf in merkle tree.
     * @param _encodedPath Encoded path to search account node in merkle tree.
     * @param _stateRoot State root for given block height.
     *
     * @return bytes32 Storage path of the variable.
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
        // Decode RLP encoded account value.
        RLP.RLPItem memory accountItem = RLP.toRLPItem(_rlpAccount);

        // Convert to list.
        RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);

        // Array 3rd position is storage root.
        storageRoot_ = RLP.toBytes32(accountArray[2]);

        // Hash the rlpValue value.
        bytes32 hashedAccount = keccak256(
            abi.encodePacked(_rlpAccount)
        );

        /*
         * Verify the remote OpenST contract against the committed state
         * root with the state trie Merkle proof.
         */
        require(
            MerklePatriciaProof.verify(
                hashedAccount,
                _encodedPath,
                _rlpParentNodes,
                _stateRoot
            ),
            "Account proof is not verified."
        );

    }

    /**
     * @notice Creates the hash of a stake intent struct based on its fields.
     *
     * @param _amount Stake amount.
     * @param _beneficiary The beneficiary address on the auxiliary chain.
     * @param _gateway The address of the  gateway where the staking took place.
     *
     * @return stakeIntentHash_ The hash that represents this stake intent.
     */
    function hashStakeIntent(
        uint256 _amount,
        address _beneficiary,
        address _gateway
    )
        external
        pure
        returns (bytes32 stakeIntentHash_)
    {
        stakeIntentHash_ = keccak256(
            abi.encode(
                STAKE_INTENT_TYPEHASH,
                _amount,
                _beneficiary,
                _gateway
            )
        );
    }

    /**
     * @notice Creates the hash of a redeem intent struct based on its fields.
     *
     * @param _amount Redeem amount.
     * @param _beneficiary The beneficiary address on the origin chain.
     * @param _gateway The address of the  gateway where the redeeming happened.
     *
     * @return redeemIntentHash_ The hash that represents this stake intent.
     */
    function hashRedeemIntent(
        uint256 _amount,
        address _beneficiary,
        address _gateway
    )
        external
        pure
        returns (bytes32 redeemIntentHash_)
    {
        redeemIntentHash_ = keccak256(
            abi.encode(
                REDEEM_INTENT_TYPEHASH,
                _amount,
                _beneficiary,
                _gateway
            )
        );
    }
}

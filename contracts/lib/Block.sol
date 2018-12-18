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
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./RLP.sol";

/**
 * @title Block provides functionality to work with blocks.
 */
library Block {

    /* Structs */

    struct Header {
        bytes32 blockHash;
        bytes32 parentHash;
        bytes32 uncleHash;
        address coinbase;
        bytes32 stateRoot;
        bytes32 transactionRoot;
        bytes32 receiptRoot;
        bytes logsBloom;
        uint256 difficulty;
        uint256 height;
        uint64 gasLimit;
        uint64 gasUsed;
        uint256 timeStamp;
        bytes extraData;
        bytes32 mixDigest;
        uint256 nonce;
    }

    /* Internal Functions */

    /**
     * @notice Decodes an RLP-encoded header into a Header struct.
     *
     * @param _blockHeaderRlp An RLP-encoded block header.
     *
     * @return header_ The header struct with the data decoded from the input.
     */
    function decodeHeader(
        bytes memory _blockHeaderRlp
    )
        internal
        pure
        returns (Header memory header_)
    {
        bytes32 blockHash = keccak256(_blockHeaderRlp);

        RLP.RLPItem memory header = RLP.toRLPItem(_blockHeaderRlp);
        RLP.RLPItem[] memory headerFields = RLP.toList(header);

        header_ = Header(
            blockHash,
            RLP.toBytes32(headerFields[0]),
            RLP.toBytes32(headerFields[1]),
            RLP.toAddress(headerFields[2]),
            RLP.toBytes32(headerFields[3]),
            RLP.toBytes32(headerFields[4]),
            RLP.toBytes32(headerFields[5]),
            RLP.toBytes(headerFields[6]),
            uint256(RLP.toUint(headerFields[7])),
            uint256(RLP.toUint(headerFields[8])),
            uint64(RLP.toUint(headerFields[9])),
            uint64(RLP.toUint(headerFields[10])),
            uint256(RLP.toUint(headerFields[11])),
            RLP.toBytes(headerFields[12]),
            RLP.toBytes32(headerFields[13]),
            uint256(RLP.toUint(headerFields[14]))
        );
    }
}

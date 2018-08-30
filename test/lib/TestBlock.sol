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

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/lib/Block.sol";

/**
 * @title Tests the Block library.
 */
contract TestBlock {

    /* External Functions */

    function testDecode() external {
        bytes memory rlpEncodedHeader = hex"f901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4";
        Block.Header memory header = Block.decodeHeader(rlpEncodedHeader);

        Assert.equal(
            header.blockHash,
            hex"0a5843ac1cb04865017cb35a57b50b07084e5fcee39b5acadade33149f4fff9e",
            "Wrong block hash."
        );
        Assert.equal(
            header.parentHash,
            hex"83cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55",
            "Wrong parent hash."
        );
        Assert.equal(
            header.uncleHash,
            hex"1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
            "Wrong uncle hash."
        );
        Assert.equal(
            header.coinbase,
            0x8888f1F195AFa192CfeE860698584c030f4c9dB1,
            "Wrong coinbase."
        );
        Assert.equal(
            header.stateRoot,
            hex"ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017",
            "Wrong state root."
        );
        Assert.equal(
            header.transactionRoot,
            hex"5fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67",
            "Wrong transaction root."
        );
        Assert.equal(
            header.receiptRoot,
            hex"bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52",
            "Wrong receipt root."
        );
        Assert.equal(
            header.difficulty,
            uint256(131072),
            "Wrong difficulty."
        );
        Assert.equal(
            header.height,
            uint256(1),
            "Wrong height."
        );
        Assert.equal(
            uint256(header.gasLimit),
            uint256(3141592),
            "Wrong gas limit."
        );
        Assert.equal(
            uint256(header.gasUsed),
            uint256(21000),
            "Wrong gas used."
        );
        Assert.equal(
            header.timeStamp,
            uint256(1426516743),
            "Wrong timestamp."
        );
        Assert.equal(
            header.mixDigest,
            hex"bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff498",
            "Wrong mix digest."
        );
        Assert.equal(
            header.nonce,
            0xa13a5a8c8f2bb1c4,
            "Wrong nonce."
        );
    }
}

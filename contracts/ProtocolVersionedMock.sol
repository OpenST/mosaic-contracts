pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
// Common: ProtocolVersionedMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./ProtocolVersioned.sol";

/**
 *  @title ProtocolVersionedMock contract.
 *
 *  @dev Overrides certain durational constants and getters to ease testing ProtocolVersioned.
 */
contract ProtocolVersionedMock is ProtocolVersioned {
    uint256 private constant PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 3;

    /**  Public functions */
    
    constructor(address _protocol)
        ProtocolVersioned(_protocol)
        public { }

    function blocksToWaitForProtocolTransfer() public pure returns (uint256) {
        return PROTOCOL_TRANSFER_BLOCKS_TO_WAIT;
    }
}
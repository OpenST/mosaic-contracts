pragma solidity ^0.5.0;

import "./EIP20CoGatewayInterface.sol";
import "../lib/Mutex.sol";

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
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract RedeemProxy is Mutex {

    /* Storage */

    /** The composer that deployed this contract. */
    address public composer;

    /** The composer deployed the StakerProxy on behalf of the owner. */
    address payable public owner;


    /* Modifiers */

    /** Requires that msg.sender is the composer */
    modifier onlyComposer() {
        require(
            msg.sender == address(composer),
            "This function can only be called by the composer."
        );

        _;
    }

    /** Requires that msg.sender is the owner. */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "This function can only be called by the owner."
        );

        _;
    }


    /* Special Functions */

    /**
     * @notice Must be constructed by a composer contract.
     *
     * @param _owner The owner that this proxy is deployed for.
     */
    constructor(address payable _owner)
        public
    {
        composer = msg.sender;
        owner = _owner;
    }

    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock,
        EIP20CoGatewayInterface _cogateway
    )
        external
        payable
        mutex
        onlyComposer
        returns(bytes32 messageHash_)
    {

    }

    function selfDestruct() external onlyComposer {
        selfdestruct(owner);
    }
}

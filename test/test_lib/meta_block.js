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

const web3 = require('./web3.js');

const ORIGINTRANSITION_TYPEHASH = web3.utils.sha3(
    "OriginTransition(uint256 dynasty,bytes32 blockHash,bytes20 coreIdentifier)"
);

/**
 * 
 * @param {object} transition The transition object to hash.
 * 
 * @returns {string} The hash of the transition.
 */
module.exports.hashOriginTransition = function(transition) {
    let encodedParameters = web3.eth.abi.encodeParameters(
        [
            'bytes32',
            'uint256',
            'bytes32',
            'bytes20',
        ],
        [
            ORIGINTRANSITION_TYPEHASH,
            transition.dynasty.toString(),
            transition.blockHash,
            transition.coreIdentifier
        ]
    );
    let hash = web3.utils.sha3(encodedParameters);

    return hash;
}

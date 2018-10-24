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

const AUXILIARYTRANSITION_TYPEHASH = web3.utils.sha3(
    'AuxiliaryTransition(bytes20 coreIdentifier,bytes32 kernelHash,uint256 auxiliaryDynasty,bytes32 auxiliaryBlockHash,uint256 gas,uint256 originDynasty,bytes32 originBlockHash,bytes32 transactionRoot)',
);

const ORIGINTRANSITION_TYPEHASH = web3.utils.sha3(
    'OriginTransition(uint256 dynasty,bytes32 blockHash,bytes20 coreIdentifier)',
);

/**
 * @param {Object} transition The transition object to hash.
 *
 * @returns {string} The hash of the transition.
 */
module.exports.hashAuxiliaryTransition = function(transition) {
    let encodedParameters = web3.eth.abi.encodeParameters(
        [
            'bytes32',
            'bytes20',
            'bytes32',
            'uint256',
            'bytes32',
            'uint256',
            'uint256',
            'bytes32',
            'bytes32',
        ],
        [
            AUXILIARYTRANSITION_TYPEHASH,
            transition.coreIdentifier,
            transition.kernelHash,
            transition.auxiliaryDynasty.toString(),
            transition.auxiliaryBlockHash,
            transition.gas.toString(),
            transition.originDynasty.toString(),
            transition.originBlockHash,
            transition.transactionRoot,
        ],
    );
    let hash = web3.utils.sha3(encodedParameters);

    return hash;
}

/**
 * @param {Object} transition The transition object to hash.
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
            transition.coreIdentifier,
        ]
    );
    let hash = web3.utils.sha3(encodedParameters);

    return hash;
}

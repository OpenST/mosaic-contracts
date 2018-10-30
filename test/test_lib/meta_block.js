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

const VOTEMESSAGE_TYPEHASH = web3.utils.sha3(
     "VoteMessage(bytes20 coreIdentifier,bytes32 transitionHash,bytes32 source,bytes32 target,uint256 sourceHeight,uint256 targetHeight)"
);
const ORIGINTRANSITION_TYPEHASH = web3.utils.sha3(
     "OriginTransition(uint256 dynasty,bytes32 blockHash,bytes20 coreIdentifier)"
);

function MetaBlockUtils() {

}

MetaBlockUtils.prototype = {
    /**
     * @param {string} address The address of the account that signs the vote.
     * @param {Object} vote The vote object to sign.
     * @returns {Object} The signature of the vote (r, s, and v).
     */
    signVote : async function (address, vote) {

        let voteDigest = web3.utils.soliditySha3(
             {type: 'bytes32', value: VOTEMESSAGE_TYPEHASH},
             {type: 'bytes20', value: web3.utils.toChecksumAddress(vote.coreIdentifier)},
             {type: 'bytes32', value: vote.transitionHash},
             {type: 'bytes32', value: vote.source},
             {type: 'bytes32', value: vote.target},
             {type: 'uint256', value: vote.sourceHeight},
             {type: 'uint256', value: vote.targetHeight},
        );

        /*
         * Signature adds the prefix `\x19Ethereum Signed Message:\n32` to the
         * voteDigest.
         */
        let signature = await web3.eth.sign(
             voteDigest,
             address
        );

        // Removing the `0x` prefix.
        signature = signature.substring(2);

        let r = '0x' + signature.substring(0, 64);
        let s = '0x' + signature.substring(64, 128);
        // Adding 27 as per the web3 documentation.
        let v = Number(signature.substring(128, 130)) + 27;

        return {
            r: r,
            s: s,
            v: v,
        };
    },

    /**
     *
     * @param {Object} transition The transition object to hash.
     *
     * @returns {string} The hash of the transition.
     */
    hashOriginTransition: function (transition) {
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
};

module.exports = new MetaBlockUtils();

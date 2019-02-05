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

const web3 = require('./web3.js');
const utils = require('./utils.js');

const messageTypeHash = utils.getTypeHash(
  'Message(bytes32 intentHash,uint256 nonce,uint256 gasPrice,uint256 gasLimit,address sender,bytes32 hashLock)',
);

function MessageBus() {}

MessageBus.prototype = {
  /**
   * Creates an EIP-712 conform hash of the message that is equal to the hash
   * generated in solidity.
   *
   * @param {string} intentHash The hash of the intent, e.g. stake or redeem.
   * @param {BN} nonce The nonce of the sender.
   * @param {BN} gasPrice The price per gas to pay for relaying the message.
   * @param {BN} gasLimit The max gas to pay for relaying the message.
   * @param {string} sender The sender (creator) of this message.
   * @param {string} hashLock A hashed secret to progress the message.
   *
   * @returns The hash of the given parameters, according to the specification
   *          of a message hash.
   */
  messageDigest: (intentHash, nonce, gasPrice, gasLimit, sender, hashLock) => {
    const digest = web3.utils.sha3(
      web3.eth.abi.encodeParameters(
        [
          'bytes32',
          'bytes32',
          'uint256',
          'uint256',
          'uint256',
          'address',
          'bytes32',
        ],
        [
          messageTypeHash,
          intentHash,
          nonce.toNumber(),
          gasPrice.toNumber(),
          gasLimit.toNumber(),
          sender,
          hashLock,
        ],
      ),
    );

    return digest;
  },

  MessageStatusEnum: {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4,
  },
};

module.exports = new MessageBus();

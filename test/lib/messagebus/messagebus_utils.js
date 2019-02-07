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
//

const utils = require('../../test_lib/utils');
const web3 = require('../../test_lib/web3.js');

const MessageBus = artifacts.require('MessageBusWrapper');

let messageBus;

class MessageBusUtils {
  static defaultParams(accounts) {
    const intentHash = web3.utils.soliditySha3({
      type: 'bytes32',
      value: 'intent',
    });
    const nonce = 1;
    const gasPrice = 0x12a05f200;
    const sender = accounts[7];
    const gasLimit = 0;
    const gasConsumed = 0;
    const messageHash = '0x9bdab5cbc3ebd8d50e3831bc73da35c1170e21bfb7145e41ce4a952b977a8f84';
    const messageStatus = 1;
    const generatedHashLock = utils.generateHashLock();
    const unlockSecret = generatedHashLock.s;
    const hashLock = generatedHashLock.l;
    const messageBoxOffset = 1;
    const rlpParentNodes = '0xf9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
    const storageRoot = '0x9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771';
    const params = {
      intentHash,
      nonce,
      sender,
      hashLock,
      gasLimit,
      gasConsumed,
      messageStatus,
      gasPrice,
      messageHash,
      unlockSecret,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
    };

    return params;
  }

  static async deployedMessageBus() {
    messageBus = await MessageBus.new();
    return messageBus;
  }

  static async declareMessage(params, changeState) {
    const {
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
      gasConsumed,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.declareMessage(
          intentHash,
          nonce,
          gasPrice,
          gasLimit,
          sender,
          hashLock,
          gasConsumed,
        ),
        params.message,
      );
    } else {
      await messageBus.declareMessage(
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        sender,
        hashLock,
        gasConsumed,
      );
    }
  }

  static async progressOutbox(params, changeState) {
    const {
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
      gasConsumed,
      unlockSecret,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.progressOutbox(
          intentHash,
          nonce,
          gasPrice,
          gasLimit,
          sender,
          hashLock,
          gasConsumed,
          unlockSecret,
        ),
        params.message,
      );
    } else {
      await messageBus.progressOutbox(
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        sender,
        hashLock,
        gasConsumed,
        unlockSecret,
      );
    }
  }

  static async declareRevocationMessage(params, changeState) {
    const {
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
      gasConsumed,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.declareRevocationMessage.call(
          intentHash,
          nonce,
          gasPrice,
          gasLimit,
          sender,
          hashLock,
          gasConsumed,
        ),
        params.message,
      );
    } else {
      await messageBus.declareRevocationMessage(
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        sender,
        hashLock,
        gasConsumed,
      );
    }
  }

  static async progressInbox(params, changeState) {
    const {
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
      gasConsumed,
      unlockSecret,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.progressInbox.call(
          intentHash,
          nonce,
          gasPrice,
          gasLimit,
          sender,
          hashLock,
          gasConsumed,
          unlockSecret,
        ),
        params.message,
      );
    } else {
      await messageBus.progressInbox(
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        sender,
        hashLock,
        gasConsumed,
        unlockSecret,
      );
    }
  }

  static async progressInboxRevocation(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
      messageStatus,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.progressInboxRevocation.call(
          intentHash,
          nonce,
          sender,
          hashLock,
        ),
        params.message,
      );
    } else {
      await messageBus.progressInboxRevocation(
        intentHash,
        nonce,
        sender,
        messageBoxOffset,
        rlpParentNodes,
        storageRoot,
        messageStatus,
        hashLock,
      );
    }
  }

  static async progressOutboxRevocation(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
      messageStatus,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.progressOutboxRevocation.call(
          intentHash,
          nonce,
          sender,
          messageBoxOffset,
          rlpParentNodes,
          storageRoot,
          messageStatus,
          hashLock,
        ),
        params.message,
      );
    } else {
      await messageBus.progressOutboxRevocation(
        intentHash,
        nonce,
        sender,
        messageBoxOffset,
        rlpParentNodes,
        storageRoot,
        messageStatus,
        hashLock,
      );
    }
  }

  static async confirmRevocation(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.confirmRevocation(
          intentHash,
          nonce,
          sender,
          messageBoxOffset,
          rlpParentNodes,
          storageRoot,
          hashLock,
        ),
        params.message,
      );
    } else {
      await messageBus.confirmRevocation(
        intentHash,
        nonce,
        sender,
        messageBoxOffset,
        rlpParentNodes,
        storageRoot,
        hashLock,
      );
    }
  }

  static async confirmMessage(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.confirmMessage(
          intentHash,
          nonce,
          sender,
          rlpParentNodes,
          storageRoot,
          messageBoxOffset,
          hashLock,
        ),
        params.message,
      );
    } else {
      await messageBus.confirmMessage(
        intentHash,
        nonce,
        sender,
        rlpParentNodes,
        storageRoot,
        messageBoxOffset,
        hashLock,
      );
    }
  }

  static async progressOutboxWithProof(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      messageBoxOffset,
      rlpParentNodes,
      storageRoot,
      messageStatus,
    } = params;

    if (changeState === false) {
      await utils.expectThrow(
        messageBus.progressOutboxWithProof.call(
          intentHash,
          nonce,
          sender,
          rlpParentNodes,
          storageRoot,
          messageStatus,
          hashLock,
          messageBoxOffset,
        ),
      );
    } else {
      await messageBus.progressOutboxWithProof(
        intentHash,
        nonce,
        sender,
        rlpParentNodes,
        storageRoot,
        messageStatus,
        hashLock,
        messageBoxOffset,
      );
    }
  }

  static async progressInboxWithProof(params, changeState) {
    const {
      intentHash,
      nonce,
      sender,
      hashLock,
      rlpParentNodes,
      storageRoot,
      messageStatus,
      messageBoxOffset,
    } = params;

    if (changeState === false) {
      await utils.expectRevert(
        messageBus.progressInboxWithProof(
          intentHash,
          nonce,
          sender,
          rlpParentNodes,
          storageRoot,
          messageStatus,
          hashLock,
          messageBoxOffset,
        ),
        params.message,
      );
    } else {
      await messageBus.progressInboxWithProof(
        intentHash,
        nonce,
        sender,
        rlpParentNodes,
        storageRoot,
        messageStatus,
        hashLock,
        messageBoxOffset,
      );
    }
  }

  static async getOutboxStatus(msgHash) {
    return messageBus.getOutboxStatus.call(msgHash);
  }

  static async getInboxStatus(msgHash) {
    return messageBus.getInboxStatus.call(msgHash);
  }
}

MessageBusUtils.prototype.utils = utils;

module.exports = MessageBusUtils;

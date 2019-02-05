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

const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');

const EventsDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');

const MosaicCore = artifacts.require('MosaicCore');

contract('MosaicCore.proposeBlock()', async (accounts) => {
  let mosaicCore;
  const minimumWeight = new BN('1');
  let auxiliaryCoreIdentifier = web3.utils.sha3('1');

  let height;
  let kernelHash;
  let auxiliaryDynasty;
  let auxiliaryBlockHash;
  let gas;
  let originDynasty;
  let originBlockHash;
  let transactionRoot;
  let maxAccumulateGasLimit;

  beforeEach(async () => {
    height = 1;
    kernelHash = web3.utils.sha3('1');
    auxiliaryDynasty = 50;
    auxiliaryBlockHash = web3.utils.sha3('1');
    gas = 1000;
    originDynasty = 1;
    originBlockHash = web3.utils.sha3('1');
    transactionRoot = web3.utils.sha3('1');
    maxAccumulateGasLimit = new BN(105000);

    const ost = accounts[0];

    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      ost,
      0,
      web3.utils.sha3('1'),
      minimumWeight,
      maxAccumulateGasLimit,
    );
  });

  it('should be able to propose meta-block', async () => {
    const tx = await mosaicCore.proposeBlock(
      height,
      auxiliaryCoreIdentifier,
      kernelHash,
      auxiliaryDynasty,
      auxiliaryBlockHash,
      gas,
      originDynasty,
      originBlockHash,
      transactionRoot,
    );

    const events = EventsDecoder.perform(
      tx.receipt,
      mosaicCore.address,
      mosaicCore.abi,
    );

    assert.equal(
      events.BlockProposed.height,
      height,
      `Meta-block should be proposed for height ${height}`,
    );
  });

  it(
    'should not be able to propose meta-block with same height as previous'
      + ' meta-block',
    async () => {
      height = 0;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Height should be one more than last meta-block.',
      );
    },
  );

  it(
    'should not be able to propose meta-block with the same gas as parent'
      + ' meta-block',
    async () => {
      gas = 0;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Gas consumed should be greater than last meta-block gas.',
      );
    },
  );

  it(
    'should not be able to propose meta-block for same height and same'
      + ' transition object which is already proposed',
    async () => {
      const tx = await mosaicCore.proposeBlock(
        height,
        auxiliaryCoreIdentifier,
        kernelHash,
        auxiliaryDynasty,
        auxiliaryBlockHash,
        gas,
        originDynasty,
        originBlockHash,
        transactionRoot,
      );

      const events = EventsDecoder.perform(
        tx.receipt,
        mosaicCore.address,
        mosaicCore.abi,
      );

      assert.equal(
        events.BlockProposed.height,
        height,
        `Meta-block should be proposed for height ${height}`,
      );

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Meta-block with same transition object is already proposed.',
      );
    },
  );

  it(
    'should not be able to propose meta-block for same auxiliary dynasty'
      + ' as parent meta-block',
    async () => {
      auxiliaryDynasty = 0;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Auxiliary dynasty should be greater than last meta-block auxiliary dynasty.',
      );
    },
  );

  it(
    'should not be able to propose meta-block for wrong auxiliary'
      + ' block chain',
    async () => {
      auxiliaryCoreIdentifier = web3.utils.sha3('2');

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'CoreIdentifier should be same as auxiliary core identifier.',
      );

      auxiliaryCoreIdentifier = web3.utils.sha3('1');
    },
  );

  it(
    'should not be able to propose meta-block if transaction root is'
      + ' not defined',
    async () => {
      transactionRoot = Utils.ZERO_BYTES32;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Transaction Root hash should not be `0`.',
      );
    },
  );

  it(
    'should not be able to propose meta-block if origin BlockHash is'
      + ' not defined',
    async () => {
      originBlockHash = Utils.ZERO_BYTES32;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Origin block should not be `0`.',
      );
    },
  );

  it('should not be able to propose meta-block if origin Dynasty is zero', async () => {
    originDynasty = 0;

    await Utils.expectThrow(
      mosaicCore.proposeBlock(
        height,
        auxiliaryCoreIdentifier,
        kernelHash,
        auxiliaryDynasty,
        auxiliaryBlockHash,
        gas,
        originDynasty,
        originBlockHash,
        transactionRoot,
      ),
      'Origin dynasty should not be `0`.',
    );
  });

  it(
    'should not be able to propose meta-block if kernel Hash is'
      + ' not defined',
    async () => {
      kernelHash = Utils.ZERO_BYTES32;

      await Utils.expectThrow(
        mosaicCore.proposeBlock(
          height,
          auxiliaryCoreIdentifier,
          kernelHash,
          auxiliaryDynasty,
          auxiliaryBlockHash,
          gas,
          originDynasty,
          originBlockHash,
          transactionRoot,
        ),
        'Kernel hash should not be `0`.',
      );
    },
  );
});

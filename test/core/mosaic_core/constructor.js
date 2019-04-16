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
// Test: constructor.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');

const Utils = require('../../test_lib/utils.js');

const MosaicCore = artifacts.require('MosaicCore');

contract('MosaicCore.constructor()', async (accounts) => {
  const auxiliaryCoreIdentifier = web3.utils.sha3('1');
  const minimumWeight = new BN('1');

  let mosaicCore;
  let gas;
  let transactionRoot;
  let ost;
  let maxAccumulateGasLimit;

  beforeEach(async () => {
    [ost] = accounts;
    gas = new BN(1000);
    transactionRoot = web3.utils.sha3('1');
    maxAccumulateGasLimit = new BN(105000);
  });

  it('should be able to deploy mosaic core', async () => {
    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );

    assert(web3.utils.isAddress(mosaicCore.address));
  });

  it('should deploy stake contract on mosaic core deployment', async () => {
    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );

    assert(web3.utils.isAddress(mosaicCore.address));

    const stakeAddress = await mosaicCore.stake.call();

    assert(web3.utils.isAddress(stakeAddress));
  });

  it('should report genesis block on mosaic core deployment', async () => {
    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );

    assert(web3.utils.isAddress(mosaicCore.address));

    const head = await mosaicCore.head.call();

    assert(head !== Utils.ZERO_BYTES32);
  });

  it('should not deploy mosaic core if transaction root is zero', async () => {
    transactionRoot = Utils.ZERO_BYTES32;
    await Utils.expectThrow(
      MosaicCore.new(
        auxiliaryCoreIdentifier,
        ost,
        gas,
        transactionRoot,
        minimumWeight,
        maxAccumulateGasLimit,
      ),
    );
  });

  it('should not deploy mosaic core if ost token root is zero', async () => {
    ost = 0;

    await Utils.expectThrow(
      MosaicCore.new(
        auxiliaryCoreIdentifier,
        ost,
        gas,
        transactionRoot,
        minimumWeight,
        maxAccumulateGasLimit,
      ),
    );
  });

  it('should not deploy mosaic core if max accumulated gas limit is zero', async () => {
    maxAccumulateGasLimit = new BN(0);

    await Utils.expectThrow(
      MosaicCore.new(
        auxiliaryCoreIdentifier,
        ost,
        gas,
        transactionRoot,
        minimumWeight,
        maxAccumulateGasLimit,
      ),
      'Max accumulated gas limit should not be zero.',
    );
  });
});

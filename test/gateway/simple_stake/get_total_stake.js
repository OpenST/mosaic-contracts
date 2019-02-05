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

const SimpleStake = artifacts.require('./SimpleStake.sol');
const MockToken = artifacts.require('./MockToken.sol');
const BN = require('bn.js');

contract('SimpleStake.getTotalStake()', (accounts) => {
  const gateway = accounts[4];
  let token;
  let simpleStake;
  beforeEach(async () => {
    token = await MockToken.new({ from: accounts[0] });

    simpleStake = await SimpleStake.new(token.address, gateway, {
      from: accounts[0],
    });
  });

  it('should return zero total staked amount after deployment.', async () => {
    const expectedTotalStakedAmount = new BN(0);

    const totalStakedAmount = await simpleStake.getTotalStake.call();

    assert.strictEqual(
      totalStakedAmount.eq(expectedTotalStakedAmount),
      true,
      'Initial total staked amount is not zero',
    );
  });

  it('should return correct total staked amount.', async () => {
    const expectedTotalStakedAmount = new BN(100);
    await token.transfer(simpleStake.address, expectedTotalStakedAmount, {
      from: accounts[0],
    });

    const totalStakedAmount = await simpleStake.getTotalStake.call();

    assert.strictEqual(
      totalStakedAmount.eq(expectedTotalStakedAmount),
      true,
      'Total staked amount is not as expected.',
    );
  });

  it(
    'should return correct total staked amount on multiple stake'
      + ' requests',
    async () => {
      let expectedTotalStakedAmount = new BN(0);

      let amount = new BN(100);
      expectedTotalStakedAmount = expectedTotalStakedAmount.add(amount);

      await token.transfer(simpleStake.address, amount, {
        from: accounts[0],
      });

      amount = new BN(180);
      expectedTotalStakedAmount = expectedTotalStakedAmount.add(amount);

      await token.transfer(simpleStake.address, amount, {
        from: accounts[0],
      });

      const totalStakedAmount = await simpleStake.getTotalStake.call();

      assert.strictEqual(
        totalStakedAmount.eq(expectedTotalStakedAmount),
        true,
        'Total staked amount is not as expected.',
      );
    },
  );
});

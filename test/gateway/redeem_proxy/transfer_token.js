const RedeemerProxy = artifacts.require('RedeemerProxy');
const SpyToken = artifacts.require('SpyToken');

const BN = require('bn.js');
const Utils = require('../../test_lib/utils');

contract('RedeemerProxy.transferToken()', (accounts) => {
  let composer;
  let owner;
  let proxy;
  let token;
  const beneficiary = accounts[3];
  const amount = new BN('100');

  beforeEach(async () => {
    composer = accounts[1];
    owner = accounts[2];
    proxy = await RedeemerProxy.new(owner, { from: composer });
    token = await SpyToken.new();
  });

  it('should successfully transfer token', async () => {
    await proxy.transferToken(token.address, beneficiary, amount, { from: owner });

    const toAddress = await token.toAddress.call();
    const transferAmount = await token.transferAmount.call();

    assert.strictEqual(
      toAddress,
      beneficiary,
      'To address must match',
    );

    assert.strictEqual(
      amount.eq(new BN(transferAmount)),
      true,
      `Transfer amount should be ${amount} instead of ${transferAmount}`,
    );
  });

  it('should fail to transferToken for non owner address', async () => {
    const nonOwnerAddress = accounts[6];
    await Utils.expectRevert(
      proxy.transferToken(token.address, beneficiary, amount, { from: nonOwnerAddress }),
      'This function can only be called by the owner.',
    );
  });

  it('should fail if EIP20 transfer fails', async () => {
    await token.setTransferFakeResponse(false);
    await Utils.expectRevert(
      proxy.transferToken(token.address, beneficiary, amount, { from: owner }),
      'EIP20Token transfer returned false.',
    );
  });

  it('should fail for zero token address', async () => {
    await Utils.expectRevert(
      proxy.transferToken(Utils.NULL_ADDRESS, beneficiary, amount, { from: owner }),
      'The token address must not be address zero.',
    );
  });
});

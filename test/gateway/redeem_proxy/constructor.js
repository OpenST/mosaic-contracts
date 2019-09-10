const RedeemerProxy = artifacts.require('RedeemerProxy');

contract('RedeemerProxy.constructor() ', (accounts) => {
  it('should construct successfully', async () => {
    const redeemPool = accounts[1];
    const owner = accounts[2];
    const proxy = await RedeemerProxy.new(owner, { from: redeemPool });

    const actualComposer = await proxy.redeemPool.call();
    const actualOwner = await proxy.owner.call();

    assert.strictEqual(
      actualComposer,
      redeemPool,
      'Redeem Pool address must match',
    );

    assert.strictEqual(
      actualOwner,
      owner,
      'Owner address must match',
    );
  });
});

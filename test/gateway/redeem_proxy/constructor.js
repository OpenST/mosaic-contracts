const RedeemerProxy = artifacts.require('RedeemerProxy');

contract('RedeemerProxy.constructor() ', (accounts) => {
  it('should construct successfully', async () => {
    const composer = accounts[1];
    const owner = accounts[2];
    const proxy = await RedeemerProxy.new(owner, { from: composer });

    const actualComposer = await proxy.composer.call();
    const actualOwner = await proxy.owner.call();

    assert.strictEqual(
      actualComposer,
      composer,
      'Composer address must match',
    );

    assert.strictEqual(
      actualOwner,
      owner,
      'Owner address must match',
    );
  });
});

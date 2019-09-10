const RedeemerProxy = artifacts.require('RedeemerProxy');

const web3 = require('../../test_lib/web3');
const Utils = require('../../test_lib/utils');

contract('RedeemerProxy.selfDestruct() ', (accounts) => {
  let redeemPool;
  let owner;
  let proxy;

  beforeEach(async () => {
    redeemPool = accounts[1];
    owner = accounts[2];
    proxy = await RedeemerProxy.new(owner, { from: redeemPool });
  });

  it('should successfully self destruct', async () => {
    await proxy.selfDestruct({ from: redeemPool });

    const code = await web3.eth.getCode(proxy.address);

    assert.strictEqual(
      code,
      '0x',
      'Contract must be self destructed',
    );
  });

  it('should fail to  self destruct for non redeemPool address', async () => {
    const nonComposerAddress = accounts[6];
    await Utils.expectRevert(
      proxy.selfDestruct({ from: nonComposerAddress }),
      'This function can only be called by the Redeem Pool.',
    );
  });
});

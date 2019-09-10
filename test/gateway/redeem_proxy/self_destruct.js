const RedeemerProxy = artifacts.require('RedeemerProxy');

const web3 = require('../../test_lib/web3');
const Utils = require('../../test_lib/utils');

contract('RedeemerProxy.selfDestruct()', (accounts) => {
  let redeemPool;
  let owner;
  let proxy;

  beforeEach(async () => {
    redeemPool = accounts[1];
    owner = accounts[2];
    proxy = await RedeemerProxy.new(owner, { from: redeemPool });
  });

  it('should successfully self destruct', async () => {
    const codeBeforeSelfDestruct = await web3.eth.getCode(proxy.address);

    await proxy.selfDestruct({ from: redeemPool });

    const codeAfterSelfDestruct = await web3.eth.getCode(proxy.address);

    assert.strictEqual(
      codeAfterSelfDestruct,
      '0x',
      'Contract must be self destructed',
    );

    assert.strictEqual(
      codeBeforeSelfDestruct.length > 2,
      true,
      `Contract must have deployed byte code but found ${codeBeforeSelfDestruct}`,
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

const RedeemPool = artifacts.require('RedeemPool');
const EIP20CoGateway = artifacts.require('SpyEIP20CoGateway');
const MockOrganization = artifacts.require('MockOrganization');
const SpyToken = artifacts.require('SpyToken');
const BN = require('bn.js');
const web3 = require('../../test_lib/web3');
const Utils = require('../../test_lib/utils');

contract('RedeemPool.acceptRedeem() ', (accounts) => {
  let eip20CoGateway;
  let redeemPool;
  let worker;
  let redeemRequest;
  let utilityToken;
  let bounty;

  beforeEach(async () => {
    worker = accounts[2];

    eip20CoGateway = await EIP20CoGateway.new();
    bounty = await eip20CoGateway.bounty.call();
    const organization = await MockOrganization.new(accounts[1], accounts[2]);
    redeemPool = await RedeemPool.new(organization.address);

    redeemRequest = {
      amount: new BN('100'),
      beneficiary: accounts[3],
      gasPrice: new BN('1'),
      gasLimit: new BN('2'),
      nonce: new BN('1'),
      cogateway: eip20CoGateway.address,
      redeemer: accounts[4],
      hashLock: web3.utils.sha3('1'),
    };

    const token = await eip20CoGateway.utilityToken.call();
    utilityToken = await SpyToken.at(token);
  });

  it('should be able to accept redeem', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    );
  });

  it('should transfer token to redeemer proxy', async () => {

    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
    await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    );
    const redeemerProxy = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);
    const toAddress = await utilityToken.toAddress.call();
    const transferAmount = await utilityToken.transferAmount.call();

    assert.strictEqual(
      toAddress,
      redeemerProxy,
      'to address for transfer from must match',
    );
    assert.strictEqual(
      new BN(transferAmount).eq(redeemRequest.amount),
      true,
      'Transfer from amount must match',
    );
  });

  it('should transfer bounty to redeemer proxy', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
    const initialBalance = await web3.eth.getBalance(redeemPool.address);
    await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    );

    const finalBalance = await web3.eth.getBalance(redeemPool.address);

    assert.strictEqual(
      initialBalance,
      finalBalance,
      'Initial base token balance must be equal to final balance as bounty is'
      + ' transferred',
    );
  });

  it('should be able to request redeem again after successful accept redeem', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
    const oldRedeemerProxy = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);
    await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    );

    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
    const newRedeemerProxy = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);

    assert.strictEqual(
      oldRedeemerProxy,
      newRedeemerProxy,
      'Redeemer proxy should be deployed once',
    );
  });

  it('should fail if redeemer proxy doesnot exists', async () => {
    await Utils.expectRevert(redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    ),
    'RedeemerProxy address is null.');
  });

  it('should fail if there is not open request redeem', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
    await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    );
    await Utils.expectRevert(redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    ),
    'Redeem request must exists.');
  });

  it('should fail if token transfer fail for redeem pool to redeemer proxy', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await utilityToken.setTransferFakeResponse(false);

    await Utils.expectRevert(redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      redeemRequest.cogateway,
      redeemRequest.hashLock,
      {
        from: worker,
        value: bounty,
      },
    ),
    'Redeem amount must be transferred to the redeem proxy.');
  });
});

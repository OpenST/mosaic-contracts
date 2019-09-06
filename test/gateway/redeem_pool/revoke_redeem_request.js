const RedeemPool = artifacts.require('RedeemPool');
const EIP20CoGateway = artifacts.require('SpyEIP20CoGateway');
const MockOrganization = artifacts.require('MockOrganization');
const SpyToken = artifacts.require('SpyToken');
const BN = require('bn.js');
const web3 = require('../../test_lib/web3');
const Utils = require('../../test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('RedeemPool.revokeRedeemRequest() ', (accounts) => {
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

  it('should be able to revoke redeem request', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await redeemPool.revokeRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );
  });

  it('should emit event', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    const expectedHash = await redeemPool.redeemRequestHashes.call(
      redeemRequest.redeemer,
      redeemRequest.cogateway,
    );

    const result = await redeemPool.revokeRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    const events = EventDecoder.getEvents(result, redeemPool);

    const eventData = events.RedeemRevoked;

    assert.strictEqual(
      eventData.redeemer,
      redeemRequest.redeemer,
      'Redeemer address must match',
    );

    assert.strictEqual(
      eventData.redeemRequestHash,
      expectedHash,
      'Redeem request hash must match',
    );
  });
  it('should transfer token to redeemer', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await redeemPool.revokeRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    const toAddress = await utilityToken.toAddress.call();
    const transferAmount = await utilityToken.transferAmount.call();

    assert.strictEqual(
      toAddress,
      redeemRequest.redeemer,
      'to address for transfer from must match',
    );
    assert.strictEqual(
      new BN(transferAmount).eq(redeemRequest.amount),
      true,
      'Transfer from amount must match',
    );
  });

  it('should allow new redeem request after revoke redeem request', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await redeemPool.revokeRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
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
  });

  it('should fail revoke redeem request if no open redeem request', async () => {
    await Utils.expectRevert(redeemPool.revokeRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    ),
    'Redeem request must exists.');
  });
});

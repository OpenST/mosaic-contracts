const RedeemPool = artifacts.require('RedeemPool');
const EIP20CoGateway = artifacts.require('SpyEIP20CoGateway');
const MockOrganization = artifacts.require('MockOrganization');
const SpyToken = artifacts.require('SpyToken');
const BN = require('bn.js');
const Utils = require('../../test_lib/utils');
const EventDecoder = require('../../test_lib/event_decoder.js');

contract('RedeemPool.requestRedeem()', (accounts) => {
  let eip20CoGateway;
  let redeemPool;
  let worker;
  let redeemRequest;
  let utilityToken;

  beforeEach(async () => {
    worker = accounts[2];
    eip20CoGateway = await EIP20CoGateway.new();
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
    };

    const token = await eip20CoGateway.utilityToken.call();
    utilityToken = await SpyToken.at(token);
  });

  it('should be able to request redeem', async () => {
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

  it('should emit event of redeem request', async () => {
    const result = await redeemPool.requestRedeem(
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
    const events = EventDecoder.getEvents(result, redeemPool);

    const eventData = events.RedeemRequested;

    assert.strictEqual(
      eventData.redeemer,
      redeemRequest.redeemer,
      'Invalid redeemer address',
    );
    assert.strictEqual(
      new BN(eventData.amount).eq(redeemRequest.amount),
      true,
      `Expected redeem amount is ${redeemRequest.amount} but got ${eventData.amount}`,
    );
    assert.strictEqual(
      eventData.gasLimit.eq(redeemRequest.gasLimit),
      true,
      `Expected gasLimit amount is ${redeemRequest.gasLimit} but got ${eventData.gasLimit}`,
    );
    assert.strictEqual(
      eventData.gasPrice.eq(redeemRequest.gasPrice),
      true,
      `Expected gasPrice amount is ${redeemRequest.gasPrice} but got ${eventData.gasPrice}`,
    );
    assert.strictEqual(
      eventData.cogateway,
      redeemRequest.cogateway,
      'Invalid cogateway address',
    );
    assert.strictEqual(
      eventData.beneficiary,
      redeemRequest.beneficiary,
      'Invalid beneficiary address',
    );
    assert.strictEqual(
      eventData.nonce.eq(redeemRequest.nonce),
      true,
      `Expected nonce amount is ${redeemRequest.nonce.toString(10)} but got ${eventData.nonce.toString(10)}`,
    );
    const redeemerProxy = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);
    assert.strictEqual(
      eventData.redeemerProxy,
      redeemerProxy,
      'Invalid reedemer proxy address',
    );

    assert.strictEqual(
      eventData.redeemRequestHash,
      expectedHash,
      'Redeem request hash must match',
    );
  });

  it('should transfer token to redeem pool on successful redeem request', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    const fromAddress = await utilityToken.fromAddress.call();
    const toAddress = await utilityToken.toAddress.call();
    const transferAmount = await utilityToken.transferAmount.call();

    assert.strictEqual(
      fromAddress,
      redeemRequest.redeemer,
      'From address for transfer from must match',
    );
    assert.strictEqual(
      toAddress,
      redeemPool.address,
      'to address for transfer from must match',
    );
    assert.strictEqual(
      new BN(transferAmount).eq(redeemRequest.amount),
      true,
      'Transfer from amount must match',
    );
  });

  it('should fail if tokens cannot be transferred from redeemer to redeem'
    + ' pool', async () => {
    await utilityToken.setTransferFromFakeResponse(false);

    await Utils.expectRevert(redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    ),
    'Utility token transfer returned false.');
  });

  it('should fail if there is existing redeem request', async () => {
    await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    );

    await Utils.expectRevert(redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    ),
    'Request for this redeemer at this co-gateway is already in process.');
  });

  it('should fail for zero redeem amount', async () => {
    await Utils.expectRevert(redeemPool.requestRedeem(
      0,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    ),
    'Redeem amount must not be zero.');
  });

  it('should fail if cogateway nonce does not match', async () => {
    await Utils.expectRevert(redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      '100',
      redeemRequest.cogateway,
      { from: redeemRequest.redeemer },
    ),
    'Incorrect redeemer nonce.');
  });
});

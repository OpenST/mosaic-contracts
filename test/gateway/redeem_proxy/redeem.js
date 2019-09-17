const RedeemerProxy = artifacts.require('RedeemerProxy');
const EIP20CoGateway = artifacts.require('SpyEIP20CoGateway');
const SpyToken = artifacts.require('SpyToken');

const BN = require('bn.js');
const web3 = require('../../test_lib/web3');
const Utils = require('../../test_lib/utils');

contract('RedeemerProxy.redeem()', (accounts) => {
  let redeemPool;
  let owner;
  let proxy;
  let eip20CoGateway;
  let redeemRequest;
  let bounty;
  let utilityToken;

  beforeEach(async () => {
    redeemPool = accounts[1];
    owner = accounts[2];
    eip20CoGateway = await EIP20CoGateway.new();
    proxy = await RedeemerProxy.new(owner, { from: redeemPool });
    bounty = await eip20CoGateway.bounty.call();
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

  it('should successfully redeem', async () => {
    await proxy.redeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.hashLock,
      redeemRequest.cogateway,
      { from: redeemPool, value: bounty },
    );
  });

  it('should approve co-gateway for redeem amount', async () => {
    await proxy.redeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.hashLock,
      redeemRequest.cogateway,
      { from: redeemPool, value: bounty },
    );

    const approveTo = await utilityToken.approveTo.call();
    const approveFrom = await utilityToken.approveFrom.call();
    const amount = await utilityToken.approveAmount.call();

    assert.strictEqual(
      approveTo,
      redeemRequest.cogateway,
      'Spender address must be co-gateway',
    );

    assert.strictEqual(
      approveFrom,
      proxy.address,
      'Approve from address must be redeemer proxy',
    );

    assert.strictEqual(
      new BN(amount).eq(redeemRequest.amount),
      true,
      `Spend amount ${amount} must be equal to redeem amount ${redeemRequest.amount}`,
    );
  });

  it('should transfer bounty to co-gateway', async () => {
    const cogatewayInitialBalance = await web3.eth.getBalance(redeemRequest.cogateway);
    await proxy.redeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.hashLock,
      redeemRequest.cogateway,
      { from: redeemPool, value: bounty },
    );
    const cogatewayFinalBalance = await web3.eth.getBalance(redeemRequest.cogateway);

    const expectedCogatewaybalance = new BN(cogatewayInitialBalance).add(new BN(bounty));
    assert.strictEqual(
      new BN(cogatewayFinalBalance).eq(expectedCogatewaybalance),
      true,
      `Cogateway final balance must be ${expectedCogatewaybalance} insteead of ${cogatewayFinalBalance} `,
    );
  });

  it('should call cogateway redeem with correct param', async () => {
    await proxy.redeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.hashLock,
      redeemRequest.cogateway,
      { from: redeemPool, value: bounty },
    );

    const amount = await eip20CoGateway.amount.call();
    const beneficiary = await eip20CoGateway.beneficiary.call();
    const gasPrice = await eip20CoGateway.gasPrice.call();
    const gasLimit = await eip20CoGateway.gasLimit.call();
    const nonce = await eip20CoGateway.nonce.call();
    const hashLock = await eip20CoGateway.hashLock.call();

    assert.strictEqual(
      new BN(amount).eq(redeemRequest.amount),
      true,
      `Redeem amount should be ${redeemRequest.amount.toString(10)} instead of ${amount.toString(10)}`,
    );
    assert.strictEqual(
      new BN(gasPrice).eq(redeemRequest.gasPrice),
      true,
      `Gas price should be ${redeemRequest.gasPrice.toString(10)} instead of ${gasPrice.toString(10)}`,
    );
    assert.strictEqual(
      new BN(gasLimit).eq(redeemRequest.gasLimit),
      true,
      `Gas limit should be ${redeemRequest.gasLimit.toString(10)} instead of ${gasLimit.toString(10)}`,
    );
    assert.strictEqual(
      new BN(nonce).eq(redeemRequest.nonce),
      true,
      `Nonc should be ${redeemRequest.nonce.toString(10)} instead of ${nonce.toString(10)}`,
    );
    assert.strictEqual(
      hashLock,
      redeemRequest.hashLock,
      `Hashlock should be ${redeemRequest.hashLock} instead of ${hashLock}`,
    );
    assert.strictEqual(
      beneficiary,
      redeemRequest.beneficiary,
      `Beneficiary should be ${redeemRequest.beneficiary} instead of ${beneficiary}`,
    );
  });

  it('should fail if non redeemPool address request redeems', async () => {
    const nonRedeemPoolAddress = accounts[6];
    await Utils.expectRevert(
      proxy.redeem(
        redeemRequest.amount,
        redeemRequest.beneficiary,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.nonce,
        redeemRequest.hashLock,
        redeemRequest.cogateway,
        { from: nonRedeemPoolAddress, value: bounty },
      ),
      'This function can only be called by the Redeem Pool.',
    );
  });
});

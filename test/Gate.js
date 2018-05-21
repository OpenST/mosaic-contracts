// Copyright 2017 OpenST Ltd.
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
// Test: Gate.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const BigNumber = require('bignumber.js');
const Gate_utils = require('./Gate_utils.js');
const HashLock = require('./lib/hash_lock.js');

contract('Gate', function(accounts) {

  var stakerAccount = accounts[0]
    , stakeAmount = new BigNumber(web3.toWei(1000, "ether"))
    , beneficiaryAccount = accounts[6]
  ;

  const deployGate = async function() {
    result   = await Gate_utils.deployGate(artifacts, accounts);
    valueToken  = result.valueToken;
    openSTValue = result.openSTValue;
    uuid = result.uuid;
    gate = result.gate;
    workers = result.workers;
    bounty = result.bounty;
    workerAddress1 = result.workerAddress1;
  };

  const approveGateAndRequestStake = async function (amount, beneficiary, staker, isSuccessCase) {
    // approve gate contract
    await valueToken.approve(gate.address, amount, { from: staker });
    // call the request stake
    return requestStake(amount, beneficiary, staker, isSuccessCase);
  };

  const requestStake = async function (amount, beneficiary, staker, isSuccessCase) {
    // intial account balances
    let initialStakerAccountBalance = await valueToken.balanceOf.call(staker)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {
      // success case
      let requestStakeResult = await gate.requestStake.call(amount, beneficiary, {from: staker});
      assert.equal(requestStakeResult, isSuccessCase);

      let requestStakeResponse = await gate.requestStake(amount, beneficiary, {from: staker});
      await Gate_utils.checkRequestStakeEvent(requestStakeResponse.logs[0],staker, amount, beneficiary);

    } else {
      // fail case
      await Utils.expectThrow(gate.requestStake(amount, beneficiary, {from: staker}));
    }

    // account balances after execution
    let finalStakerAccountBalance = await valueToken.balanceOf.call(staker)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {
      // check balances for success case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.sub(amount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.plus(amount)), true);
    } else {
      // check balances for failed case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.requestStake(amount, beneficiary, {from: staker}));
  };

  const revertStakeRequest = async function (staker, amount , isSuccessCase) {
    // intial account balances
    let initialStakerAccountBalance = await valueToken.balanceOf.call(staker)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {
      // success case steps
      let revertRequestStakeResult = await gate.revertStakeRequest.call({from: staker});
      assert.equal(revertRequestStakeResult, true);

      let revertRequestStakeResponse = await gate.revertStakeRequest({from: staker});
      await Gate_utils.checkStakeRequestRevertedEvent(revertRequestStakeResponse.logs[0],staker, amount);
    } else {
      // fail case steps
      await Utils.expectThrow(gate.revertStakeRequest({from: staker}));
    }

    let finalStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;
    if (isSuccessCase) {
      // check balances for success case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.plus(amount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(amount)), true);
    } else {
      // check balances for failed case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.revertStakeRequest({from: staker}));
  };

  const rejectStakeRequest = async function (staker, amount, reason, messageSender, isSuccessCase) {

    // load intial account balance
    let initialStakerAccountBalance = await valueToken.balanceOf.call(staker)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {

      let rejectRequestStakeResult = await gate.rejectStakeRequest.call(staker, reason, {from: messageSender});
      assert.equal(rejectRequestStakeResult, true);

      let rejectRequestStakeResponse = await gate.rejectStakeRequest(staker, reason, {from: messageSender});
      await Gate_utils.checkStakeRequestRejectedEvent(rejectRequestStakeResponse.logs[0],staker, amount, reason);

    } else {
      await Utils.expectThrow(gate.rejectStakeRequest(staker, reason, {from: messageSender}));
    }

    // load balances after execution
    let finalStakerAccountBalance = await valueToken.balanceOf.call(staker)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {
      // check balances for success case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.plus(amount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(amount)), true);
    } else {
      // check balances for failed case
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.rejectStakeRequest(staker, reason, {from: messageSender}));
  };

  const acceptStakeRequest = async function(staker, amount, lock, messageSender, isSuccessCase) {

    let initialworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      , bountyAmount = await gate.bounty.call()
    ;

    let stakingIntentHash = null;

    if (isSuccessCase) {

      let stakingIntentHashParams = await getStakingIntentHashParams(staker, amount, lock, messageSender);
      let amountUT = stakingIntentHashParams.amountUT;
      let nonce = stakingIntentHashParams.nonce;
      let unlockHeight = stakingIntentHashParams.unlockHeight;

      stakingIntentHash = stakingIntentHashParams.stakingIntentHash;

      let acceptStakeRequestResponse = await gate.acceptStakeRequest(staker, lock.l, {from: messageSender});
      await Gate_utils.checkStakeRequestAcceptedEvent(acceptStakeRequestResponse.logs[0],staker, amount, amountUT, nonce, unlockHeight, stakingIntentHash);
    } else {
      await Utils.expectThrow(gate.acceptStakeRequest(staker, lock.l, {from: messageSender}));
    }

    let finalworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    if (isSuccessCase) {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance.sub(bountyAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.plus(bountyAmount).sub(amount)), true);

    } else {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.acceptStakeRequest(staker, lock.l, {from: messageSender}));

    return {lock: lock, stakingIntentHash: stakingIntentHash} ;
  };

  const processStaking = async function (stakingIntentHash, unlockSecret, messageSender, isSuccessCase) {

    let initialworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , initialWorkerBalance = await valueToken.balanceOf.call(workers)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      , bountyAmount = await gate.bounty.call()
    ;

    if (isSuccessCase) {
      let processStakingResult = await gate.processStaking.call(stakingIntentHash, unlockSecret, {from: messageSender});
      assert.equal(processStakingResult, true);

      let processStakingResponse = await gate.processStaking(stakingIntentHash, unlockSecret, {from: messageSender});
      //await Gate_utils.checkProcessedStakeEvent(processStakingResponse.logs[0],stakerAccount, stakeAmount);
    } else {
      await Utils.expectThrow(gate.processStaking(stakingIntentHash, unlockSecret, {from: messageSender}));
    }


    let finalworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      , finalWorkerBalance = await valueToken.balanceOf.call(workers)
    ;

    if (isSuccessCase) {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance), true);
      assert.equal(finalWorkerBalance.equals(initialWorkerBalance.plus(bountyAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(bountyAmount)), true);
    } else {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance), true);
      assert.equal(finalWorkerBalance.equals(initialWorkerBalance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.processStaking(stakingIntentHash, unlockSecret, {from: messageSender}));
  };

  const revertStaking = async function (stakingIntentHash, messageSender, isSuccessCase) {

    let initialworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , initialWorkerBalance = await valueToken.balanceOf.call(workers)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      , bountyAmount = await gate.bounty.call()
    ;

    var waitTime = await openSTValue.blocksToWaitLong.call();
    waitTime = waitTime.toNumber();
    // Wait time less 1 block for preceding test case and 1 block because condition is <=
    for (var i = 0; i < waitTime-2 ; i++) {
      await Utils.expectThrow(gate.revertStaking(stakingIntentHash, {from: messageSender}));
    }

    if (isSuccessCase) {
      let revertStakingResponse = await gate.revertStaking(stakingIntentHash, {from: messageSender});
    } else {
      await Utils.expectThrow(gate.revertStaking(stakingIntentHash, {from: messageSender}));
    }


    let finalworkerAddress1Balance = await valueToken.balanceOf.call(messageSender)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      , finalWorkerBalance = await valueToken.balanceOf.call(workers)
    ;

    if (isSuccessCase) {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance), true);
      assert.equal(finalWorkerBalance.equals(initialWorkerBalance.plus(bountyAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(bountyAmount)), true);

    } else {
      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance), true);
      assert.equal(finalWorkerBalance.equals(initialWorkerBalance), true);
      assert.equal(finalGateBalance.equals(initialGateBalance), true);
    }

    // request again should fail
    await Utils.expectThrow(gate.revertStaking(stakingIntentHash, {from: messageSender}));

  };

  const getStakingIntentHashParams = async function (staker, amount, lock, messageSender) {
    let acceptStakeRequestResult = await gate.acceptStakeRequest.call(staker, lock.l, {from: messageSender});
    let amountUT = acceptStakeRequestResult[0];
    let nonce = acceptStakeRequestResult[1];
    let unlockHeight = acceptStakeRequestResult[2].plus(1);

    stakingIntentHash = await openSTValue.hashStakingIntent.call(uuid, staker, nonce, beneficiaryAccount, amount,
      amountUT, unlockHeight, lock.l);

    return {
      stakingIntentHash: stakingIntentHash,
      amountUT: amountUT,
      nonce: nonce,
      unlockHeight: unlockHeight,
      uuid: uuid,
      staker: staker,
      beneficiaryAccount: beneficiaryAccount,
      amountST: amount,
      hashLock: lock.l
    }
  };

  describe('Properties', async () => {

    before (async () => {
      await deployGate();
    });

    it('has workers', async () => {
      assert.equal(await gate.workers.call(), workers);
    });

    it('has bounty', async () => {
      let bountyValue = await gate.bounty.call();
      assert.equal(bountyValue.toNumber(), bounty);
    });

    it('has uuid', async () => {
      let gateUUID = await gate.uuid.call();
      assert.equal(gateUUID, uuid);
    });

    it('has openSTProtocol', async () => {
      assert.equal(await gate.openSTProtocol.call(), openSTValue.address);
    });
  });

  describe('requestStake', async () => {
    beforeEach (async () => {
      await deployGate();
    });

    it('successfully processes request stake', async () => {
      await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
    });

    it('fails to processes request stake when stake amount is 0', async () => {
      await approveGateAndRequestStake(new BigNumber(0), beneficiaryAccount, stakerAccount, false);
    });

    it('fails to processes request stake when beneficiary account is 0', async () => {
      await approveGateAndRequestStake(stakeAmount, 0, stakerAccount, false);
    });

    it('fails to processes request stake when staker account has not approved gate contract', async () => {
      await requestStake(stakeAmount, beneficiaryAccount, stakerAccount, false);
    });
  });


  describe('revertStakeRequest', async () => {

    let bountyAmount = null;
    let lock = null;

    beforeEach (async () => {
      await deployGate();
      bountyAmount = await gate.bounty.call();
      lock = HashLock.getHashLock();
    });

    it('successfully processes revert stake request', async () => {
      await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
      await revertStakeRequest(stakerAccount, stakeAmount ,true);
    });

    it('fails to processes revert stake request when staker account has not requested stake before', async () => {
      await revertStakeRequest(stakerAccount, stakeAmount ,false);
    });

    it('fails to processes revert stake request after stake request was accepted', async () => {
      await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

      await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
      await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });
      await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);

      await revertStakeRequest(stakerAccount, stakeAmount ,false);
    });

  });

  describe('rejectStakeRequest', async () => {

    let bountyAmount = null;
    let lock = null;
    let rejectReason = 2;

    beforeEach (async () => {
      await deployGate();
      bountyAmount = await gate.bounty.call();
      lock = HashLock.getHashLock();
    });

    it('successfully processes reject stake request', async () => {
      await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
      await rejectStakeRequest(stakerAccount, stakeAmount, rejectReason, workerAddress1, true);
    });

    it('fails to processes reject stake request when staker account has not requested to stake before', async () => {
      await rejectStakeRequest(stakerAccount, stakeAmount, rejectReason, workerAddress1, false);
    });

    it('fails to processes reject stake request after stake request was accepted', async () => {
      await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

      await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
      await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });

      await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);

      await rejectStakeRequest(stakerAccount, stakeAmount, rejectReason, workerAddress1, false);
    });
  });


    describe('acceptStakeRequest', async () => {

      let bountyAmount = null;
      let lock = null;

      beforeEach (async () => {

        await deployGate();

        bountyAmount = await gate.bounty.call();
        lock = HashLock.getHashLock();
      });

      it('successfully processes accept stake request', async () => {

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });

        await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);

      });

      it('fails to processes accept stake request when worker is not whitelisted address', async () => {

        let workerAddress = accounts[10];
        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

        await valueToken.transfer(workerAddress, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress });

        await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress, false);

      });

      it('fails to processes accept stake request when staker address is blank', async () => {

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });

        await acceptStakeRequest(0, stakeAmount, lock, workerAddress1, false);

      });

      it('fails to processes accept stake request when hash lock is blank', async () => {

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });

        lock.l = 0;
        lock.s = 0;
        await acceptStakeRequest(0, stakeAmount, lock, workerAddress1, false);

      });

      it('fails to processes accept stake request when worker address has insufficient balance', async () => {

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });
        await acceptStakeRequest(0, stakeAmount, lock, workerAddress1, false);

      });

      it('fails to processes accept stake request when worker address has not approved gate contract', async () => {

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await acceptStakeRequest(0, stakeAmount, lock, workerAddress1, false);

      });

    });


    describe('processStaking', async () => {

      let bountyAmount = null;
      let lock = null;

      beforeEach (async () => {
        await deployGate();
        bountyAmount = await gate.bounty.call();
        lock = HashLock.getHashLock();

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);

        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });
      });

      it('successfully processes', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await processStaking(stakingIntentHash, lock.s, workerAddress1, true);

      });

      it('fails to processes when the worker address is not whitelisted', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        let workerAddress = accounts[10];
        await processStaking(stakingIntentHash, lock.s, workerAddress, false);

      });

      it('fails to processes when stakingIntentHash is 0', async () => {

        await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        await processStaking(0, lock.s, workerAddress1, false);

      });

      it('fails to processes when stakingIntentHash is invalid', async () => {

        await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        await processStaking(beneficiaryAccount, lock.s, workerAddress1, false);

      });

      it('fails to processes when unlockSecret is 0', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await processStaking(stakingIntentHash, 0, workerAddress1, false);

      });

      it('fails to processes when unlockSecret is invalid', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await processStaking(stakingIntentHash, beneficiaryAccount, workerAddress1, false);

      });

      it('fails to processes when stakeRequest was not accepted', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);
        await processStaking(stakingIntentHashParams.stakingIntentHash, stakingIntentHashParams.hashLock, workerAddress1, false);

      });

      it('fails to processes when stakeRequest was rejected', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);

        await rejectStakeRequest(stakerAccount, stakeAmount, 0,  workerAddress1, true);
        await processStaking(stakingIntentHashParams.stakingIntentHash, stakingIntentHashParams.hashLock, workerAddress1, false);

      });

      it('fails to processes when stakeRequest was reverted', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);

        await revertStakeRequest(stakerAccount, stakeAmount ,true);
        await processStaking(stakingIntentHashParams.stakingIntentHash, stakingIntentHashParams.hashLock, workerAddress1, false);

      });

    });


    describe('revertStaking', async () => {

      let bountyAmount = null;
      let lock = null;

      beforeEach (async () => {
        await deployGate();
        bountyAmount = await gate.bounty.call();
        lock = HashLock.getHashLock();

        await approveGateAndRequestStake(stakeAmount, beneficiaryAccount, stakerAccount, true);
        await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});
        await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });
      });

      it('successfully processes', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await revertStaking(stakingIntentHash, workerAddress1, true);

      });

      it('fails to process when already processStake is called', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await processStaking(stakingIntentHash, lock.s, workerAddress1, true);

        await revertStaking(stakingIntentHash, workerAddress1, false);

      });

      it('fails to process when stakingIntentHash is 0', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await revertStaking(0, workerAddress1, false);

      });

      it('fails to process when stakingIntentHash is invalid', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        await revertStaking(beneficiaryAccount, workerAddress1, false);

      });

      it('fails to process when worker is not whitelisted', async () => {

        let stakeResult = await acceptStakeRequest(stakerAccount, stakeAmount, lock, workerAddress1, true);
        let stakingIntentHash = stakeResult['stakingIntentHash'];

        let workerAddress = accounts[10];
        await revertStaking(stakingIntentHash, workerAddress, false);

      });


      it('fails to processes when stakeRequest was not accepted', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);
        await revertStaking(stakingIntentHashParams.stakingIntentHash, workerAddress1, false);

      });

      it('fails to processes when stakeRequest was rejected', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);

        await rejectStakeRequest(stakerAccount, stakeAmount, 0, workerAddress1, true);
        await revertStaking(stakingIntentHashParams.stakingIntentHash, workerAddress1, false);
      });

      it('fails to processes when stakeRequest was reverted', async () => {

        let stakingIntentHashParams = await getStakingIntentHashParams(stakerAccount, stakeAmount, lock, workerAddress1);

        await revertStakeRequest(stakerAccount, stakeAmount ,true);
        await revertStaking(stakingIntentHashParams.stakingIntentHash, workerAddress1, false);
      });

    })

});



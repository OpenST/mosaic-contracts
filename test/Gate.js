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
    , workerAddress1 = accounts[7];
  ;

  const deployGate = async function() {
    result   = await Gate_utils.deployGate(artifacts, accounts);
    valueToken  = result.valueToken;
    openSTValue = result.openSTValue;
    uuid = result.uuid;
    gate = result.gate;
    workers = result.workers;
    bounty = result.bounty;
  };

  const requestStake = async function () {
    let initialStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
    ;
    // approve gate contract
    await valueToken.approve(gate.address, stakeAmount, { from: stakerAccount });

    let requestStakeResult = await gate.requestStake.call(stakeAmount, beneficiaryAccount, {from: stakerAccount});
    assert.equal(requestStakeResult, true);

    let requestStakeResponse = await gate.requestStake(stakeAmount, beneficiaryAccount, {from: stakerAccount});
    await Gate_utils.checkRequestStakeEvent(requestStakeResponse.logs[0],stakerAccount, stakeAmount, beneficiaryAccount);

    let finalStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;
    // check balances
    assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.sub(stakeAmount)), true);
    assert.equal(finalGateBalance.equals(initialGateBalance.plus(stakeAmount)), true);

    // request again should fail
    await Utils.expectThrow(gate.requestStake(stakeAmount, beneficiaryAccount, {from: stakerAccount}));
  };

  const acceptStakeRequest = async function() {
    await valueToken.transfer(workerAddress1, new BigNumber(web3.toWei(10000, "ether")),{from: accounts[0]});

    let initialworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
      , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      , bountyAmount = await gate.bounty.call()
      , lock = HashLock.getHashLock()
    ;

    await valueToken.approve(gate.address, bountyAmount, { from: workerAddress1 });

    let acceptStakeRequestResult = await gate.acceptStakeRequest.call(stakerAccount, lock.l, {from: workerAddress1});
    let amountUT = acceptStakeRequestResult[0];
    let nonce = acceptStakeRequestResult[1];
    let unlockHeight = acceptStakeRequestResult[2].plus(1);

    let stakingIntentHash = await openSTValue.hashStakingIntent.call(uuid, stakerAccount, nonce, beneficiaryAccount, stakeAmount,
      amountUT, unlockHeight, lock.l);

    let acceptStakeRequestResponse = await gate.acceptStakeRequest(stakerAccount, lock.l, {from: workerAddress1});
    await Gate_utils.checkStakeRequestAcceptedEvent(acceptStakeRequestResponse.logs[0],stakerAccount, stakeAmount, amountUT, nonce, unlockHeight, stakingIntentHash);

    let finalworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
      , finalGateBalance = await valueToken.balanceOf.call(gate.address)
    ;

    // check balances
    assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance.sub(bountyAmount)), true);
    assert.equal(finalGateBalance.equals(initialGateBalance.plus(bountyAmount).sub(stakeAmount)), true);

    // request again should fail
    await Utils.expectThrow(gate.acceptStakeRequest(stakerAccount, lock.l, {from: workerAddress1}));

    return {lock: lock, stakingIntentHash: stakingIntentHash} ;
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
    before (async () => {
      await deployGate();
    });

    it('successfully processes request stake', async () => {
      await requestStake();
    });
  });

  describe('revertStakeRequest', async () => {

    before (async () => {
      await deployGate();
      await requestStake();
    });

    it('successfully processes revert request stake', async () => {

      let initialStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
        , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      ;

      let revertRequestStakeResult = await gate.revertStakeRequest.call({from: stakerAccount});
      assert.equal(revertRequestStakeResult, true);

      let revertRequestStakeResponse = await gate.revertStakeRequest({from: stakerAccount});
      await Gate_utils.checkStakeRequestRevertedEvent(revertRequestStakeResponse.logs[0],stakerAccount, stakeAmount);

      let finalStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
        , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      ;
      // check balances
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.plus(stakeAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(stakeAmount)), true);

      // request again should fail
      await Utils.expectThrow(gate.revertStakeRequest({from: stakerAccount}));

    })
  });

  describe('rejectStakeRequest', async () => {

    before (async () => {
      await deployGate();
      await requestStake();
    });

    it('successfully processes reject request stake', async () => {

      let initialStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
        , initialGateBalance = await valueToken.balanceOf.call(gate.address)
      ;

      let rejectRequestStakeResult = await gate.rejectStakeRequest.call(stakerAccount, {from: workerAddress1});
      assert.equal(rejectRequestStakeResult, true);

      let rejectRequestStakeResponse = await gate.rejectStakeRequest(stakerAccount, {from: workerAddress1});
      await Gate_utils.checkStakeRequestRejectedEvent(rejectRequestStakeResponse.logs[0],stakerAccount, stakeAmount);

      let finalStakerAccountBalance = await valueToken.balanceOf.call(stakerAccount)
        , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      ;
      // check balances
      assert.equal(finalStakerAccountBalance.equals(initialStakerAccountBalance.plus(stakeAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(stakeAmount)), true);

      // request again should fail
      await Utils.expectThrow(gate.rejectStakeRequest(stakerAccount, {from: workerAddress1}));

    })
  });


  describe('acceptStakeRequest', async () => {

    before (async () => {
      await deployGate();
      await requestStake();
    });

    it('successfully processes accept request stake', async () => {
      await acceptStakeRequest();
    })

  });

  describe('processStaking', async () => {

    before (async () => {
      await deployGate();
      await requestStake();
      stakeResult = await acceptStakeRequest();
      stakingIntentHash = stakeResult['stakingIntentHash'];
      lock = stakeResult['lock'];
    });

    it('successfully processes', async () => {

      let initialworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
        , initialGateBalance = await valueToken.balanceOf.call(gate.address)
        , bountyAmount = await gate.bounty.call()
      ;

      let processStakingResult = await gate.processStaking.call(stakingIntentHash, lock.s, {from: workerAddress1});
      assert.equal(processStakingResult, true);

      let processStakingResponse = await gate.processStaking(stakingIntentHash, lock.s, {from: workerAddress1});
      //await Gate_utils.checkProcessedStakeEvent(processStakingResponse.logs[0],stakerAccount, stakeAmount);

      let finalworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
        , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      ;

      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance.plus(bountyAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(bountyAmount)), true);

      // request again should fail
      await Utils.expectThrow(gate.processStaking(stakingIntentHash, lock.s, {from: workerAddress1}));

    })

  });

  describe('revertStaking', async () => {

    before (async () => {
      await deployGate();
      await requestStake();
      stakeResult = await acceptStakeRequest();
      stakingIntentHash = stakeResult['stakingIntentHash'];
    });

    it('successfully processes', async () => {

      let initialworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
        , initialGateBalance = await valueToken.balanceOf.call(gate.address)
        , bountyAmount = await gate.bounty.call()
      ;

      var waitTime = await openSTValue.blocksToWaitLong.call();
      waitTime = waitTime.toNumber();
      // Wait time less 1 block for preceding test case and 1 block because condition is <=
      for (var i = 0; i < waitTime-2 ; i++) {
        await Utils.expectThrow(gate.revertStaking(stakingIntentHash, {from: workerAddress1}));
      }

      let revertStakingResponse = await gate.revertStaking(stakingIntentHash, {from: workerAddress1});
      console.log("revertStakingResponse: ",revertStakingResponse);

      let finalworkerAddress1Balance = await valueToken.balanceOf.call(workerAddress1)
        , finalGateBalance = await valueToken.balanceOf.call(gate.address)
      ;

      // check balances
      assert.equal(finalworkerAddress1Balance.equals(initialworkerAddress1Balance.plus(bountyAmount)), true);
      assert.equal(finalGateBalance.equals(initialGateBalance.sub(bountyAmount)), true);

      // request again should fail
      await Utils.expectThrow(gate.revertStaking(stakingIntentHash, {from: workerAddress1}));

    })

  })
});



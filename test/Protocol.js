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
// Test: stake Simple Token for utility tokens and branded tokens
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Assert = require('assert');
const BigNumber = require('bignumber.js');
const utils = require("./lib/utils.js");
const openSTValueUtils = require("./OpenSTValue_utils.js");
const openSTUtilityUtils = require('./OpenSTUtility_utils.js');
const web3EventsDecoder = require('./lib/event_decoder.js');

const ProtocolUtils = require('./Protocol_utils.js');

const openSTUtilityArtifacts = artifacts.require("./OpenSTUtilityMock.sol");
const openSTValueArtifacts = artifacts.require("./OpenSTValueMock.sol");
const BrandedToken = artifacts.require("./BrandedToken.sol");
const SimpleStake = artifacts.require("./SimpleStake.sol");

const CHAINID_VALUE   = new BigNumber(2001);
const CHAINID_UTILITY = new BigNumber(2002);

contract('OpenST', function(accounts) {
	
	const TOKEN_SYMBOL   = "ST";
	const TOKEN_NAME     = "Simple Token";
	const TOKEN_DECIMALS = 18;
	const TOKENS_MAX     = new BigNumber(web3.toWei(800000000, "ether"));
	
	const STPRIME_SYMBOL          = "STP";
	const STPRIME_NAME            = "SimpleTokenPrime";
	const STPRIME_CONVERSION_RATE = new BigNumber(1);

	// Member Details
	const symbol = "BT";
	const name = "Branded Token";
	const conversionRate = 10;

	const deployMachine = accounts[0];
	const owner         = accounts[1];
	const admin         = accounts[2];
	const ops           = accounts[3];
	const intercommVC   = accounts[4];
	const intercommUC   = accounts[5];
	const requester     = accounts[6];
	const staker        = accounts[7];
	const redeemer      = accounts[8];

	const AMOUNT_ST = new BigNumber(web3.toWei(1000, "ether"));
	const AMOUNT_BT = new BigNumber(AMOUNT_ST*conversionRate);
	const REDEEM_AMOUNT_BT = new BigNumber(web3.toWei(5, "ether"));
	const REDEEM_AMOUNT_STPRIME = new BigNumber(web3.toWei(15, "ether"));

	describe('Setup Utility chain with Simple Token Prime', function () {

		var simpleToken = null;
		var registrarVC = null;
		var registrarUC = null;
		var coreVC      = null;
		var openSTValue = null;
		var openSTUtility = null;
		var stPrime = null;
		var btSimpleStake = null;

    var btSimpleStakeContractAddress = null;
    var stPrimeSimpleStakeContractAddress = null;
		var registeredBrandedTokenUuid = null;
		var registeredBrandedToken = null;
		var nonceBT = null;
		var uuidSTP = null;
		var nonceSTP = null;
		var stakingIntentHash = null;
		var unlockHeight = null;
		var redemptionIntentHash = null;
		var redeemedAmountST = null;

		before(async () => {
			var contracts = await ProtocolUtils.deployOpenSTProtocol(artifacts, accounts);
			simpleToken = contracts.token;
			registrarVC = contracts.registrarVC;
			registrarUC = contracts.registrarUC;
			openSTValue = contracts.openSTValue;
			openSTUtility = contracts.openSTUtility;
			// core on VC to represent UC
			coreVC = contracts.coreVC;
		    stPrime = contracts.stPrime;
		});

		context('deploy and configure utility chain', function() {

			it("add core to represent utility chain", async () => {
				const o = await registrarVC.addCore(openSTValue.address, coreVC.address, { from: intercommVC });
				Assert.ok(o);
				utils.logResponse(o, "RegistrarVC.addCore");
				Assert.equal(await openSTValue.core.call(CHAINID_UTILITY), coreVC.address);
			});

			it("register Simple Token Prime", async () => {
				const uuidSTP = await openSTUtility.uuidSTPrime.call();
				Assert.notEqual(uuidSTP, "");
				const o = await registrarVC.registerUtilityToken(openSTValue.address, STPRIME_SYMBOL, STPRIME_NAME,
					STPRIME_CONVERSION_RATE, CHAINID_UTILITY, 0, uuidSTP, { from: intercommVC });
				utils.logResponse(o, "RegistrarVC.registerUtilityToken (STP)");

				var formattedDecodedEvents = web3EventsDecoder.perform(o.receipt, openSTValue.address, openSTValueArtifacts.abi);

				openSTValueUtils.checkUtilityTokenRegisteredEventOnProtocol(formattedDecodedEvents, uuidSTP,
          			STPRIME_SYMBOL, STPRIME_NAME, TOKEN_DECIMALS, STPRIME_CONVERSION_RATE, CHAINID_UTILITY, 0);

				var event = formattedDecodedEvents['UtilityTokenRegistered'];

				stPrimeSimpleStakeContractAddress = event.stake;

				Assert.notEqual((await openSTValue.utilityTokens.call(uuidSTP))[5], utils.NullAddress);
			});

			// Initialize Transfer to ST' Contract Address
			it("initialize transfer to Simple Token Prime contract address", async () => {
				Assert.equal(await web3.eth.getBalance(stPrime.address),  0);

			 	const o = await stPrime.initialize({ from: deployMachine, value:  TOKENS_MAX});
				utils.logResponse(o, "STPrime.initialize");
				var stPrimeContractBalanceAfterTransfer = await web3.eth.getBalance(stPrime.address).toNumber();
				Assert.equal(stPrimeContractBalanceAfterTransfer,  TOKENS_MAX);
		    });

		    it("report gas usage: deployment and setup", async () => {
				utils.printGasStatistics();
				utils.clearReceipts();
			});
		});

		context('stake Simple Token for Simple Token Prime', function() {

			it("stake Simple Token", async () => {
				uuidSTP = await openSTUtility.uuidSTPrime.call();
				// transfer ST to staker account
				Assert.ok(await simpleToken.transfer(staker, AMOUNT_ST, { from: deployMachine }));
				// staker sets allowance for OpenSTValue
				Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: staker }));
				// for testing purpose query nonceSTP in advance
				nonceSTP = await openSTValue.getNextNonce.call(staker);
				Assert.equal(nonceSTP, 1);
				// staker calls OpenSTValue.stake to initiate the staking for ST' with uuidSTP
				// with staker as the beneficiary
				const o = await openSTValue.stake(uuidSTP, AMOUNT_ST, staker, { from: staker });
				utils.logResponse(o, "OpenSTValue.stake");
				openSTValueUtils.checkStakingIntentDeclaredEventProtocol(o.logs[0], uuidSTP, staker, nonceSTP, staker,
					AMOUNT_ST, AMOUNT_ST, CHAINID_UTILITY);
				stakingIntentHash = o.logs[0].args._stakingIntentHash;
				unlockHeight = o.logs[0].args._unlockHeight;
			});

			it("confirm staking intent for Simple Token Prime", async () => {
				// registrar registers staking intent on utility chain
				const o = await registrarUC.confirmStakingIntent(openSTUtility.address, uuidSTP, staker, nonceSTP,
					staker, AMOUNT_ST, AMOUNT_ST, unlockHeight, stakingIntentHash, { from: intercommUC });
				  utils.logResponse(o, "OpenSTUtility.confirmStakingIntent");
			});

			it("process staking", async () => {
				const o = await openSTValue.processStaking(stakingIntentHash, { from: staker });
				utils.logResponse(o, "OpenSTValue.processStaking");
			});

			it("process minting", async () => {
				const o = await openSTUtility.processMinting(stakingIntentHash, { from: staker });
				utils.logResponse(o, "OpenSTUtility.processMinting");
			});

			it("claim Simple Token Prime", async () => {
				var balanceBefore = await web3.eth.getBalance(staker);
				const o = await stPrime.claim(staker, { from: intercommUC });
				utils.logResponse(o, "STPrime.claim");
				var balanceAfter = await web3.eth.getBalance(staker);
				var totalSupply = await stPrime.totalSupply.call();
				Assert.equal(totalSupply.toNumber(), AMOUNT_ST.toNumber());
				Assert.equal(balanceAfter.sub(balanceBefore).toNumber(), AMOUNT_ST.toNumber());
			});

			it("report gas usage: staking Simple Token Prime", async () => {
				utils.printGasStatistics();
				utils.clearReceipts();
			});
		});

		context('propose and register branded token', function() {
	    // propose branded token

		    it("propose branded token for member company", async() => {

		      const result = await openSTUtility.proposeBrandedToken(symbol, name, conversionRate, {from: requester});
		      var eventLog = result.logs[0];

		      openSTUtilityUtils.validateProposedBrandedTokenEvent(eventLog, requester, symbol, name, conversionRate);

		      registeredBrandedTokenUuid = eventLog.args._uuid;
		      registeredBrandedToken = eventLog.args._token;
	          brandedToken = BrandedToken.at(registeredBrandedToken);

    	      utils.logResponse(result, "OpenSTUtility.proposeBrandedToken");
		    });

		    // register Branded Token on Utility Chain

		    it("register branded token on utility chain", async() => {

		      const result = await registrarUC.registerBrandedToken(openSTUtility.address, symbol, name,
		        conversionRate, requester, registeredBrandedToken, registeredBrandedTokenUuid, { from: intercommUC });

		      var formattedDecodedEvents = web3EventsDecoder.perform(result.receipt, openSTUtility.address, openSTUtilityArtifacts.abi);

		      openSTUtilityUtils.checkRegisteredBrandedTokenEventOnProtocol(formattedDecodedEvents, registrarUC.address,
		        registeredBrandedToken, registeredBrandedTokenUuid, symbol, name, conversionRate, requester);

	          utils.logResponse(result, "OpenSTUtility.registerBrandedToken");
		    });

		    // register Utility Token on Value Chain

		    it("register utility token on value chain", async() => {

		     	const result = await registrarVC.registerUtilityToken(openSTValue.address, symbol, name, conversionRate,
		    		CHAINID_UTILITY, requester, registeredBrandedTokenUuid, { from: intercommVC });

		    	var formattedDecodedEvents = web3EventsDecoder.perform(result.receipt, openSTValue.address, openSTValueArtifacts.abi);

		     	openSTValueUtils.checkUtilityTokenRegisteredEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
		    		symbol, name, TOKEN_DECIMALS, conversionRate, CHAINID_UTILITY, requester);

				var event = formattedDecodedEvents['UtilityTokenRegistered'];

				btSimpleStakeContractAddress = event.stake;

				btSimpleStake = SimpleStake.at(btSimpleStakeContractAddress);

				utils.logResponse(result, "OpenSTValue.registerUtilityToken");

		    });

	        it("report gas usage: register and propose branded token", async () => {
				utils.printGasStatistics();
				utils.clearReceipts();
	        });

		});

		// stake ST for BT
		context('stake Simple Token for Branded Token', function() {

			it("approve and stake Simple Token", async() => {
				// transfer ST to requester account
				Assert.ok(await simpleToken.transfer(requester, AMOUNT_ST, { from: deployMachine }));
				// Check for requester simpleToken Balance
				var balanceOfRequester = await simpleToken.balanceOf(requester);
				Assert.equal(balanceOfRequester, AMOUNT_ST.toNumber());
				// requester sets allowance for OpenSTValue
				Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: requester }));

				//  Query nonceBT in advance
				nonceBT = await openSTValue.getNextNonce.call(requester);
				Assert.equal(nonceBT, 1);
				// requester calls OpenSTValue.stake to initiate the staking for Branded Token with registeredBrandedTokenUuid
				// with requester as the beneficiary
				var stakeResult = await openSTValue.stake(registeredBrandedTokenUuid, AMOUNT_ST, requester, { from: requester });

				openSTValueUtils.checkStakingIntentDeclaredEventProtocol(stakeResult.logs[0], registeredBrandedTokenUuid, requester, nonceBT,
					requester, AMOUNT_ST, AMOUNT_BT, CHAINID_UTILITY);

				stakingIntentHash = stakeResult.logs[0].args._stakingIntentHash;
				unlockHeight = stakeResult.logs[0].args._unlockHeight;
				nonceBT = stakeResult.logs[0].args._stakerNonce;

				utils.logResponse(stakeResult, "OpenSTUtility.approveAndStake");

		    });

			it("confirm staking intent for Branded Token", async() => {

				const result = await registrarUC.confirmStakingIntent(openSTUtility.address, registeredBrandedTokenUuid,
					requester, nonceBT, requester, AMOUNT_ST, AMOUNT_BT, unlockHeight, stakingIntentHash, { from: intercommUC });

				var formattedDecodedEvents = web3EventsDecoder.perform(result.receipt, openSTUtility.address, openSTUtilityArtifacts.abi);

				openSTUtilityUtils.checkStakingIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
					stakingIntentHash, requester, requester, AMOUNT_ST, AMOUNT_BT);

				utils.logResponse(result, "OpenSTUtility.confirmStakingIntent");

			});

			it("process staking", async() => {
				const result = await openSTValue.processStaking(stakingIntentHash, { from: requester });

				openSTValueUtils.checkProcessedStakeEvent(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash,
					btSimpleStakeContractAddress, requester, AMOUNT_ST, AMOUNT_BT);

				utils.logResponse(result, "OpenSTValue.processStaking");

			});

			it("process minting", async() => {

				const result = await openSTUtility.processMinting(stakingIntentHash, { from: requester });

				openSTUtilityUtils.checkProcessedMintEvent(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash,
					registeredBrandedToken, requester, requester, AMOUNT_BT);

				utils.logResponse(result, "OpenSTValue.processminting");
			});

			it("claim Branded Token", async() => {
				var balanceBefore = await brandedToken.balanceOf(requester);
				const o = await brandedToken.claim(requester, { from: intercommUC });
				var balanceAfter = await brandedToken.balanceOf(requester);
				var totalSupply = await brandedToken.totalSupply.call();
				Assert.equal(totalSupply.toNumber(), AMOUNT_BT.toNumber());
				Assert.equal(balanceAfter.sub(balanceBefore).toNumber(), AMOUNT_BT.toNumber());
			});

			it("report gas usage: stake Simple Token for Branded Token", async () => {
				utils.printGasStatistics();
				utils.clearReceipts();
			});

		});

		context('Transfer Branded Token and STPrime to Redeemer', function() {

			it("transfer branded token from Requester to Redeemer", async() => {

				var result = await brandedToken.transfer(redeemer, REDEEM_AMOUNT_BT, { from: requester });
				Assert.ok(result);
				var balanceOfRedeemer = await brandedToken.balanceOf(redeemer);
				Assert.equal(balanceOfRedeemer, REDEEM_AMOUNT_BT.toNumber());

				utils.logResponse(result, "brandedToken.transfer");

			});

			it("transfer STPrime to Redeemer", async() => {

				var redeemerBalanceBeforeTransfer = await web3.eth.getBalance(redeemer).toNumber();
				result = await web3.eth.sendTransaction({ from: staker, to: redeemer, value: REDEEM_AMOUNT_STPRIME ,gasPrice: '0x12A05F200' });
				var redeemerBalanceAfterTransfer = await web3.eth.getBalance(redeemer).toNumber();
				Assert.equal((redeemerBalanceBeforeTransfer+(REDEEM_AMOUNT_STPRIME.toNumber())), redeemerBalanceAfterTransfer);

			});

			it("report gas usage: Transfer Branded Token and STPrime to Redeemer", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

		context('Redeem and Unstake Branded Token', function() {

			it("approve branded token", async() => {

				var approveResult = await brandedToken.approve(openSTUtility.address, REDEEM_AMOUNT_BT, { from: redeemer })
				Assert.ok(approveResult);
				utils.logResponse(approveResult, "OpenSTUtility.approveResult");

			});

			it("call redeem", async() => {

				nonce = await openSTValue.getNextNonce.call(redeemer);
				var redeemResult = await openSTUtility.redeem(registeredBrandedTokenUuid, REDEEM_AMOUNT_BT, nonce, { from: redeemer });
				redemptionIntentHash = redeemResult.logs[0].args._redemptionIntentHash;
				unlockHeight = redeemResult.logs[0].args._unlockHeight;
				openSTUtilityUtils.checkRedemptionIntentDeclaredEvent(redeemResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash, brandedToken.address,
						redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, CHAINID_VALUE);
				utils.logResponse(redeemResult, "OpenSTUtility.redeem");

			});

			it("confirm redemption intent", async() => {

				var confirmRedemptionResult = await registrarVC.confirmRedemptionIntent( openSTValue.address, registeredBrandedTokenUuid,
				redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, redemptionIntentHash, { from: intercommVC });

				var formattedDecodedEvents = web3EventsDecoder.perform(confirmRedemptionResult.receipt, openSTValue.address, openSTValueArtifacts.abi);
				redeemedAmountST = (REDEEM_AMOUNT_BT/conversionRate);
				openSTValueUtils.checkRedemptionIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
					redemptionIntentHash, redeemer, redeemedAmountST, REDEEM_AMOUNT_BT);

				utils.logResponse(confirmRedemptionResult, "OpenSTValue.confirmRedemptionIntent");

			});

			it("process redemption", async() => {

				var processRedeemingResult = await openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer });

				openSTUtilityUtils.checkProcessedRedemptionEvent(processRedeemingResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					brandedToken.address, redeemer, REDEEM_AMOUNT_BT)

				utils.logResponse(processRedeemingResult, "openSTUtility.processRedeeming");

			});

			it("process unstake", async() => {

				var processUnstakeResult = await openSTValue.processUnstaking(redemptionIntentHash, { from: redeemer });

				openSTValueUtils.checkProcessedUnstakeEvent(processUnstakeResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					btSimpleStakeContractAddress, redeemer, redeemedAmountST);

				utils.logResponse(processUnstakeResult, "openSTValue.processUnstaking");

		 	});

			it("report gas usage: Redeem and Unstake Branded Token", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

		 // unstake STPrime by Redeemer
		context('Redeem and Unstake STPrime', function() {

			it("call redeem", async() => {

				nonce = await openSTValue.getNextNonce.call(redeemer);
				var redeemResult = await openSTUtility.redeemSTPrime(nonce, { from: redeemer, value: REDEEM_AMOUNT_STPRIME });
				redemptionIntentHash = redeemResult.logs[0].args._redemptionIntentHash;
				unlockHeight = redeemResult.logs[0].args._unlockHeight;
				openSTUtilityUtils.checkRedemptionIntentDeclaredEvent(redeemResult.logs[0], uuidSTP, redemptionIntentHash, stPrime.address,
					redeemer, nonce, REDEEM_AMOUNT_STPRIME, unlockHeight, CHAINID_VALUE);

				utils.logResponse(redeemResult, "OpenSTUtility.STPrime.redeem");

			});

			it("confirm redemption intent", async() => {

				var confirmRedemptionResult = await registrarVC.confirmRedemptionIntent( openSTValue.address, uuidSTP, redeemer, nonce,
					REDEEM_AMOUNT_STPRIME, unlockHeight, redemptionIntentHash, { from: intercommVC });

				var formattedDecodedEvents = web3EventsDecoder.perform(confirmRedemptionResult.receipt,
					openSTValue.address, openSTValueArtifacts.abi);
				openSTValueUtils.checkRedemptionIntentConfirmedEventOnProtocol(formattedDecodedEvents, uuidSTP,
					redemptionIntentHash, redeemer, REDEEM_AMOUNT_STPRIME, REDEEM_AMOUNT_STPRIME);

				utils.logResponse(confirmRedemptionResult, "OpenSTValue.STPrime.confirmRedemptionIntent");

			});

			it("process redemption", async() => {

				var processRedeemingResult = await openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer });

				openSTUtilityUtils.checkProcessedRedemptionEvent(processRedeemingResult.logs[0], uuidSTP, redemptionIntentHash,
					stPrime.address, redeemer, REDEEM_AMOUNT_STPRIME)

				utils.logResponse(processRedeemingResult, "openSTUtility.STPrime.processRedeeming");

			});

			it("process unstake", async() => {

				var processUnstakeResult = await openSTValue.processUnstaking(redemptionIntentHash, { from: redeemer });

				var event = processUnstakeResult.logs[0];
				openSTValueUtils.checkProcessedUnstakeEvent(event, uuidSTP, redemptionIntentHash,
					stPrimeSimpleStakeContractAddress, redeemer, REDEEM_AMOUNT_STPRIME);
				utils.logResponse(processUnstakeResult, "openSTValue.STPrime.processUnstaking");

			});

			it("report gas usage: Redeem and Unstake Simple Token Prime", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

    // Revert stake
    context('Revert stake', function() {

      it("call stake ", async() => {
        // transfer ST to requester account
        Assert.ok(await simpleToken.transfer(requester, AMOUNT_ST, { from: deployMachine }));
      	// Check for requester simpleToken Balance
      	var balanceOfRequester = await simpleToken.balanceOf(requester);
      	Assert.equal(balanceOfRequester, AMOUNT_ST.toNumber());
      	// requester sets allowance for OpenSTValue
      	Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: requester }));

      	nonceBT = await openSTValue.getNextNonce.call(requester);
      	// requester calls OpenSTValue.stake to initiate the staking for Branded Token with registeredBrandedTokenUuid
      	// with requester as the beneficiary
      	var stakeResult = await openSTValue.stake(registeredBrandedTokenUuid, AMOUNT_ST, requester, { from: requester });

      	openSTValueUtils.checkStakingIntentDeclaredEventProtocol(stakeResult.logs[0], registeredBrandedTokenUuid, requester, nonceBT,
        	requester, AMOUNT_ST, AMOUNT_BT, CHAINID_UTILITY);

      	stakingIntentHash = stakeResult.logs[0].args._stakingIntentHash;

    	});

      // // Before wait time as passed
      it('fails to revertStaking before waiting period ends', async () => {
      	var waitTime = await openSTValue.blocksToWaitLong.call();
      	waitTime = waitTime.toNumber();
      	const amount = new BigNumber(1);
        // Wait time less 1 block for preceding test case and 1 block because condition is <=
      	for (var i = 0; i < waitTime/2 ; i++) {
      		await web3.eth.sendTransaction({ from: owner, to: admin, value: amount });
          await web3.eth.sendTransaction({ from: admin, to: owner, value: amount });
      	}
      });

			it("revert staking after unlocking block height", async() => {
        // Revert staking from staker user as it can called from any external user.
        // If we put this as a contrain this test case will fail
        var result = await openSTValue.revertStaking(stakingIntentHash, {from: staker});
      	openSTValueUtils.checkRevertStakingEventProtocol(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash, requester,
        	AMOUNT_ST, AMOUNT_BT)

			});

    });

    // // Revert minting
    // // Revert staking should also work smoothly before calling revert minting
    context('Revert minting', function() {

			it("call stake ", async() => {
					// transfer ST to requester account
				Assert.ok(await simpleToken.transfer(requester, AMOUNT_ST, { from: deployMachine }));
				// requester sets allowance for OpenSTValue
				Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: requester }));

				nonceBT = await openSTValue.getNextNonce.call(requester);
				// requester calls OpenSTValue.stake to initiate the staking for Branded Token with registeredBrandedTokenUuid
				// with requester as the beneficiary
				var stakeResult = await openSTValue.stake(registeredBrandedTokenUuid, AMOUNT_ST, requester, { from: requester });

				openSTValueUtils.checkStakingIntentDeclaredEventProtocol(stakeResult.logs[0], registeredBrandedTokenUuid, requester, nonceBT,
					requester, AMOUNT_ST, AMOUNT_BT, CHAINID_UTILITY);

				stakingIntentHash = stakeResult.logs[0].args._stakingIntentHash;
      	unlockHeight = stakeResult.logs[0].args._unlockHeight;
      	nonceBT = stakeResult.logs[0].args._stakerNonce;

			});

      it("confirm staking intent for Branded Token", async() => {

        const result = await registrarUC.confirmStakingIntent(openSTUtility.address, registeredBrandedTokenUuid,
        requester, nonceBT, requester, AMOUNT_ST, AMOUNT_BT, unlockHeight, stakingIntentHash, { from: intercommUC });

      	var formattedDecodedEvents = web3EventsDecoder.perform(result.receipt, openSTUtility.address, openSTUtilityArtifacts.abi);

      	openSTUtilityUtils.checkStakingIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
        	stakingIntentHash, requester, requester, AMOUNT_ST, AMOUNT_BT);

      	utils.logResponse(result, "OpenSTUtility.confirmStakingIntent");

    	});

      // Before wait time as passed
			// Revert minting should run only if revert staking can be done. Hence checking that first
      it('fails to revertStaking before waiting period ends', async () => {
        var waitTime = await openSTValue.blocksToWaitLong.call();
      	waitTime = waitTime.toNumber();
      	// Wait time less 1 block for preceding test case and 1 block because condition is <=
      	const amount = new BigNumber(1);
      	for (var i = 0; i < waitTime/2; i++) {
          await web3.eth.sendTransaction({ from: owner, to: admin, value: amount });
          await web3.eth.sendTransaction({ from: admin, to: owner, value: amount });
      	}
    	});

      it("revert staking after unlocking block height", async() => {
        // Revert staking from staker user as it can called from any external user.
        // If we put this as a contraint this test case will fail
        var result = await openSTValue.revertStaking(stakingIntentHash, {from: staker});
      	openSTValueUtils.checkRevertStakingEventProtocol(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash, requester,
        	AMOUNT_ST, AMOUNT_BT)

    	});

      // Before wait time as passed
			it('fails to revertMinting before expiration block', async () => {
				var waitTime = await openSTUtility.blocksToWaitShort.call();
				waitTime = waitTime.toNumber();
				// Wait time less 1 block for preceding test case and 1 block because condition is <=

				const amount = new BigNumber(1);
				for (var i = 0; i < waitTime/2; i++) {
          await web3.eth.sendTransaction({ from: owner, to: admin, value: amount });
          await web3.eth.sendTransaction({ from: admin, to: owner, value: amount });
				}
			});

			it("revert minting after expiring block height", async() => {
        // Revert minting from staker user as it can called from any external user.
        // If we put this as a contraint this test case will fail
				var result = await openSTUtility.revertMinting(stakingIntentHash, {from: staker});
      	openSTUtilityUtils.checkRevertedMintEvent(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash,
					requester, requester, AMOUNT_BT)

    	});

    });
    //
    // // After process staking, revertStake cannot be called but revertMinting can still be called.
    // // As of now ST get stuck in SimpleStake Contract for the staker which should ideally be returned after revertMinting
    // // Checking the ST balance in SimpleStake as non zero which will start failing once we fix the issue of
    // // releasing ST after revertMinting as well
    context('Revert minting after process Staking', function() {

    	var previousSTBalance = null;

    	it("previous balance on simple stake", async() => {

        previousSTBalance = await btSimpleStake.getTotalStake.call();

    	});

      it("call stake ", async() => {

				// transfer ST to requester account
				Assert.ok(await simpleToken.transfer(requester, AMOUNT_ST, { from: deployMachine }));
				Assert.ok(await simpleToken.approve(openSTValue.address, AMOUNT_ST, { from: requester }));

				nonceBT = await openSTValue.getNextNonce.call(requester);
				// requester calls OpenSTValue.stake to initiate the staking for Branded Token with registeredBrandedTokenUuid
				// with requester as the beneficiary
				var stakeResult = await openSTValue.stake(registeredBrandedTokenUuid, AMOUNT_ST, requester, { from: requester });

				openSTValueUtils.checkStakingIntentDeclaredEventProtocol(stakeResult.logs[0], registeredBrandedTokenUuid, requester, nonceBT,
					requester, AMOUNT_ST, AMOUNT_BT, CHAINID_UTILITY);

				stakingIntentHash = stakeResult.logs[0].args._stakingIntentHash;
				unlockHeight = stakeResult.logs[0].args._unlockHeight;
				nonceBT = stakeResult.logs[0].args._stakerNonce;

    	});

      it("confirm staking intent for Branded Token", async() => {

        const result = await registrarUC.confirmStakingIntent(openSTUtility.address, registeredBrandedTokenUuid,
        requester, nonceBT, requester, AMOUNT_ST, AMOUNT_BT, unlockHeight, stakingIntentHash, { from: intercommUC });

				var formattedDecodedEvents = web3EventsDecoder.perform(result.receipt, openSTUtility.address, openSTUtilityArtifacts.abi);

				openSTUtilityUtils.checkStakingIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
					stakingIntentHash, requester, requester, AMOUNT_ST, AMOUNT_BT);

				utils.logResponse(result, "OpenSTUtility.confirmStakingIntent");

    	});

      it("process staking", async () => {
        const o = await openSTValue.processStaking(stakingIntentHash, { from: requester });
      	utils.logResponse(o, "OpenSTValue.processStaking");
    	});

      // Before wait time as passed
      it('fails to revertMinting before expiration block', async () => {
        var waitTime = await openSTUtility.blocksToWaitShort.call();
		 		waitTime = waitTime.toNumber();
      	// Wait time less 1 block for preceding test case and 1 block because condition is <=

      	const amount = new BigNumber(1);
      	for (var i = 0; i < waitTime/2; i++) {
          await web3.eth.sendTransaction({ from: owner, to: admin, value: amount });
          await web3.eth.sendTransaction({ from: admin, to: owner, value: amount });
      	}
    	});

      // Before wait time as passed
      // Revert staking called after unlock block
      it('fails to revertStaking before waiting period ends', async () => {
        var waitTime = await openSTValue.blocksToWaitLong.call();
      	waitTime = waitTime.toNumber();
      	// Wait time less 1 block for preceding test case and 1 block because condition is <=
      	const amount = new BigNumber(1);				
      	for (var i = 0; i < waitTime/2; i++) {
        	await web3.eth.sendTransaction({ from: owner, to: admin, value: amount });
        	await web3.eth.sendTransaction({ from: admin, to: owner, value: amount });
      	}
    	});

      it("revert staking should not be allowed after processStaking", async() => {
        await utils.expectThrow(openSTValue.revertStaking(stakingIntentHash, {from: staker}));
    	});

      it("revert minting after expiring block height", async() => {
        // Revert minting from staker user as it can be called from any external user.
        // If we put this as a contraint this test case will fail
        var result = await openSTUtility.revertMinting(stakingIntentHash, {from: staker});
      	openSTUtilityUtils.checkRevertedMintEvent(result.logs[0], registeredBrandedTokenUuid, stakingIntentHash,
        	requester, requester, AMOUNT_BT);
    	});

      it ("validate if the ST is stuck in Simple Stake", async() => {
				var currentStBalance = await btSimpleStake.getTotalStake.call()
				var tobeBalance = previousSTBalance.toNumber() + AMOUNT_ST.toNumber();
				Assert.equal(currentStBalance.toNumber(), tobeBalance)
			});

    });

			// SEQUENCE OF EVENTS
		 // Call Redeem => Call RevertRedemption
		//
		context('call redeem then revertRedemption', function() {

			// Redeemer should have some branded token
			it("transfers branded token to redeemer", async() => {

				var result = await brandedToken.transfer(redeemer, REDEEM_AMOUNT_BT, {from: requester});
				Assert.ok(result);
				var balanceOfRedeemer = await brandedToken.balanceOf(redeemer);
				Assert.equal(balanceOfRedeemer, REDEEM_AMOUNT_BT.toNumber());

				utils.logResponse(result, "OpenSTUtility.revertRedemption.transfer");

			});

			// Call redeem
			it("gives allowance and calls redeem", async() => {

				var approveResult = await brandedToken.approve(openSTUtility.address, REDEEM_AMOUNT_BT, { from: redeemer });
				Assert.ok(approveResult);

				nonce = await openSTValue.getNextNonce.call(redeemer);
				var redeemResult = await openSTUtility.redeem(registeredBrandedTokenUuid, REDEEM_AMOUNT_BT, nonce, { from: redeemer });
				redemptionIntentHash = redeemResult.logs[0].args._redemptionIntentHash;
				unlockHeight = redeemResult.logs[0].args._unlockHeight;
				openSTUtilityUtils.checkRedemptionIntentDeclaredEvent(redeemResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					brandedToken.address, redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, CHAINID_VALUE);

				utils.logResponse(redeemResult, "OpenSTUtility.revertRedemption.redeem");

			});

			// Wait though fake transactions so that redeem is expired
			it('waits till redeem is expired', async () => {
				 var waitTime = await openSTUtility.blocksToWaitLong.call();
				 waitTime = waitTime.toNumber();
				 var amountToTransfer = new BigNumber(web3.toWei(0.000001, "ether"));				 
					// Mock transactions so that block number increases
				 for (var i = 0; i < waitTime; i++) {
					 await web3.eth.sendTransaction({ from: owner, to: admin, value: amountToTransfer, gasPrice: '0x12A05F200' });
				 }
			});

			// after redeem, revert redemption can be called
			it("revert redemption", async() => {

				var revertResult = await openSTUtility.revertRedemption(redemptionIntentHash, { from: redeemer });
				openSTUtilityUtils.checkRevertedRedemption(revertResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash, redeemer,
					REDEEM_AMOUNT_BT);

				utils.logResponse(revertResult, "OpenSTUtility.redeem.revertRedemption");

			});

			// Reports gas usage
			it("report gas usage: revert redemption", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

		   // SEQUENCE OF EVENTS
		 // Redeem => confirmRedemptionIntent => revertRedemption => revertUnstaking
		//
		context('call redeem then confirmRedemptionIntent then revertRedemption then revertUnstaking', function() {

			// Since we reverted redemption in above case we don't need to transfer again as redeemer will already have REDEEM_AMOUNT_BT balance
			it("check branded token balance of redeemer", async() => {

				var balanceOfRedeemer = await brandedToken.balanceOf(redeemer);
				Assert.equal(balanceOfRedeemer, REDEEM_AMOUNT_BT.toNumber());

			});

			// Gives allawance and call redeem
			it("gives allowance and calls redeem", async() => {

				var approveResult = await brandedToken.approve(openSTUtility.address, REDEEM_AMOUNT_BT, { from: redeemer })
				Assert.ok(approveResult);

				nonce = await openSTValue.getNextNonce.call(redeemer);
				var redeemResult = await openSTUtility.redeem(registeredBrandedTokenUuid, REDEEM_AMOUNT_BT, nonce, { from: redeemer });
				redemptionIntentHash = redeemResult.logs[0].args._redemptionIntentHash;
				unlockHeight = redeemResult.logs[0].args._unlockHeight;
				openSTUtilityUtils.checkRedemptionIntentDeclaredEvent(redeemResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					brandedToken.address, redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, CHAINID_VALUE);

				utils.logResponse(redeemResult, "OpenSTUtility.revertUnstake.redeem");

			});

			// Call confirmRedemptionIntent
			it("calls confirmRedemptionIntent", async() => {

				var confirmRedemptionResult = await registrarVC.confirmRedemptionIntent( openSTValue.address, registeredBrandedTokenUuid,
					redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, redemptionIntentHash, { from: intercommVC });
				var formattedDecodedEvents = web3EventsDecoder.perform(confirmRedemptionResult.receipt, openSTValue.address, openSTValueArtifacts.abi);
				redeemedAmountST = (REDEEM_AMOUNT_BT/conversionRate);
				openSTValueUtils.checkRedemptionIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
					redemptionIntentHash, redeemer, redeemedAmountST, REDEEM_AMOUNT_BT);
				utils.logResponse(confirmRedemptionResult, "OpenSTUtility.revertUnstake.confirmRedemptionIntent");

			});

			// Fake transactions so that redeem is expired and revertRedemption can be called
			it('waits till redeem is expired', async () => {
				var waitTime = await openSTUtility.blocksToWaitLong.call();
				waitTime = waitTime.toNumber();
				var amountToTransfer =  new BigNumber(web3.toWei(0.000001, "ether"));				 
				// Mock transactions so that block number increases
				for (var i = 0; i < waitTime; i++) {
					await web3.eth.sendTransaction({ from: owner, to: admin, value: amountToTransfer, gasPrice: '0x12A05F200' });
				}
			});

			// Revert Redemption
			it("reverts redemption", async() => {

				var revertRedemptionResult = await openSTUtility.revertRedemption(redemptionIntentHash, { from: redeemer });
				openSTUtilityUtils.checkRevertedRedemption(revertRedemptionResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					redeemer, REDEEM_AMOUNT_BT);

				utils.logResponse(revertRedemptionResult, "OpenSTUtility.revertUnstake.revertRedemption");

			});

			// Fake transactions so that unstakes is expired and revertUnstakes can be called
			it('waits till unstake is expired', async () => {
				var waitTime = await openSTValue.blocksToWaitShort.call();
				waitTime = waitTime.toNumber();
				var amountToTransfer =  new BigNumber(web3.toWei(0.000001, "ether"));				 
				// Mock transactions so that block number increases
				for (var i = 0; i < waitTime; i++) {
					await web3.eth.sendTransaction({ from: owner, to: admin, value: amountToTransfer, gasPrice: '0x12A05F200' });
				}
			});

			// Revert unstakes
			it("reverts unstake", async() => {

				var revertUnstakingResult = await openSTValue.revertUnstaking(redemptionIntentHash, { from: redeemer });
				openSTValueUtils.checkRevertedUnstake(revertUnstakingResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					redeemer, redeemedAmountST);
				utils.logResponse(revertUnstakingResult, "OpenSTUtility.revertUnstake.revertUnstaking");

			});

			// Report Gas usages
			it("report gas usage: revert unstake", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

		  // SEQUENCE OF EVENTS
		 // Redeem => confirmRedemptionIntent => ProcessRedemption => revertRedemption => revertUnstaking
		//
		context('call redeem then confirmRedemptionIntent then ProcessRedemption then revertRedemption then revertUnstaking', function() {

			var previousSTBalance = null;

			it("previous balance on simple stake contract", async() => {

				previousSTBalance = await btSimpleStake.getTotalStake.call();

			});

			// Since we reverted redemption in above case we don't need to transfer again as redeemer will already have REDEEM_AMOUNT_BT balance
			it("check branded token balance of redeemer", async() => {

				var balanceOfRedeemer = await brandedToken.balanceOf(redeemer);
				Assert.equal(balanceOfRedeemer, REDEEM_AMOUNT_BT.toNumber());

			});

			// Gives allawance and call redeem
			it("gives allowance and calls redeem", async() => {

				var approveResult = await brandedToken.approve(openSTUtility.address, REDEEM_AMOUNT_BT, { from: redeemer })
				Assert.ok(approveResult);

				nonce = await openSTValue.getNextNonce.call(redeemer);
				var redeemResult = await openSTUtility.redeem(registeredBrandedTokenUuid, REDEEM_AMOUNT_BT, nonce, { from: redeemer });
				redemptionIntentHash = redeemResult.logs[0].args._redemptionIntentHash;
				unlockHeight = redeemResult.logs[0].args._unlockHeight;
				openSTUtilityUtils.checkRedemptionIntentDeclaredEvent(redeemResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					brandedToken.address, redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, CHAINID_VALUE);

				utils.logResponse(redeemResult, "OpenSTUtility.revertUnstake.redeem");

			});

			// Call confirmRedemptionIntent
			it("calls confirmRedemptionIntent", async() => {

				var confirmRedemptionResult = await registrarVC.confirmRedemptionIntent( openSTValue.address, registeredBrandedTokenUuid,
				redeemer, nonce, REDEEM_AMOUNT_BT, unlockHeight, redemptionIntentHash, { from: intercommVC });
				var formattedDecodedEvents = web3EventsDecoder.perform(confirmRedemptionResult.receipt, openSTValue.address, openSTValueArtifacts.abi);
				redeemedAmountST = (REDEEM_AMOUNT_BT/conversionRate);
				openSTValueUtils.checkRedemptionIntentConfirmedEventOnProtocol(formattedDecodedEvents, registeredBrandedTokenUuid,
					redemptionIntentHash, redeemer, redeemedAmountST, REDEEM_AMOUNT_BT);
				utils.logResponse(confirmRedemptionResult, "OpenSTUtility.revertUnstake.confirmRedemptionIntent");

			});

			it("process redemption", async() => {

				var processRedeemingResult = await openSTUtility.processRedeeming(redemptionIntentHash, { from: redeemer });

				openSTUtilityUtils.checkProcessedRedemptionEvent(processRedeemingResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					brandedToken.address, redeemer, REDEEM_AMOUNT_BT)

				utils.logResponse(processRedeemingResult, "openSTUtility.revertUnstake.processRedeeming");

			});

			// Fake transactions so that redeem is expired and revertRedemption can be called
			it('waits till redeem is expired', async () => {

				var waitTime = await openSTUtility.blocksToWaitLong.call();
				waitTime = waitTime.toNumber();
				var amountToTransfer =  new BigNumber(web3.toWei(0.000001, "ether"));	

				// Mock transactions so that block number increases
				for (var i = 0; i < waitTime; i++) {
					await web3.eth.sendTransaction({ from: owner, to: admin, value: amountToTransfer, gasPrice: '0x12A05F200' });
				}

			});

			// Revert Redemption
			it("reverts redemption", async() => {

				await utils.expectThrow(openSTUtility.revertRedemption(redemptionIntentHash, { from: redeemer }));

			});

			// Fake transactions so that unstakes is expired and revertUnstakes can be called
			it('waits till unstake is expired', async () => {

				var waitTime = await openSTValue.blocksToWaitShort.call();
				waitTime = waitTime.toNumber();
				var amountToTransfer =  new BigNumber(web3.toWei(0.000001, "ether"));

				// Mock transactions so that block number increases
				for (var i = 0; i < waitTime; i++) {
					await web3.eth.sendTransaction({ from: owner, to: admin, value: amountToTransfer, gasPrice: '0x12A05F200' });
				}

			});

			// Revert unstakes
			it("reverts unstake", async() => {

				var revertUnstakingResult = await openSTValue.revertUnstaking(redemptionIntentHash, { from: redeemer });
				openSTValueUtils.checkRevertedUnstake(revertUnstakingResult.logs[0], registeredBrandedTokenUuid, redemptionIntentHash,
					redeemer, redeemedAmountST);
				utils.logResponse(revertUnstakingResult, "OpenSTUtility.revertUnstake.revertUnstaking");

			});


			it("checks that branded token has been burned but SimpleToken has not been releases to redeemer", async() => {

				// Branded token has burned so balance will be 0
				var balanceOfRedeemer = await brandedToken.balanceOf(redeemer);
				Assert.equal(balanceOfRedeemer, 0);

			  // Simple Token has not been released so previous and current balance is same
				var currentStBalance = await btSimpleStake.getTotalStake.call();
				Assert.equal(previousSTBalance.toNumber(), currentStBalance.toNumber());

			});

			// Report Gas usages
			it("report gas usage: revert unstake", async () => {

				utils.printGasStatistics();
				utils.clearReceipts();

			});

		});

	});
});

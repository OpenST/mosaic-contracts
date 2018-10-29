const CoreUtils = require('../../utils.js');
const EventsDecoder = require('../../../test_lib/event_decoder.js');
const web3 = require('../../../test_lib/web3.js');
const BN = require('bn.js');
const StakeUtils = require('../../stake/helpers/stake_utils.js');
const Stake = artifacts.require('Stake');

const Utils = function () {
};


Utils.prototype = {

    verifyVote: async function (stakeAmount, validator, vote, originCore, kernelHash, expectedTotalWeight) {

        validator = web3.utils.toChecksumAddress(validator);

        let sig = await CoreUtils.signVote(validator, vote);

        let tx = await originCore.verifyVote(
             kernelHash,
             vote.coreIdentifier,
             vote.transitionHash,
             vote.source,
             vote.target,
             vote.sourceHeight,
             vote.targetHeight,
             sig.v,
             sig.r,
             sig.s
        );

        let events = EventsDecoder.perform(tx.receipt, originCore.address, originCore.abi);

        assert.equal(
             web3.utils.toChecksumAddress(events.VoteVerified.validator),
             validator,
             `Verify event should recover validator signature`
        );

        assert.equal(
             events.VoteVerified.kernelHash,
             kernelHash,
             `Kernel hash should match`
        );

        assert.equal(
             events.VoteVerified.transitionHash,
             vote.transitionHash,
             `transitionHash hash should match`
        );

        assert.equal(
             events.VoteVerified.v,
             sig.v,
             `V of signature should match`
        );

        assert.equal(
             events.VoteVerified.r,
             sig.r,
             `R of signature should match`
        );

        assert.equal(
             events.VoteVerified.s,
             sig.s,
             `S of signature should match`
        );

        assert(
             expectedTotalWeight.eq(new BN(events.VoteVerified.totalWeight)),
             `expected total weight ${expectedTotalWeight.toString(10)}` +
             `and actual total weight ${events.VoteVerified.totalWeight.toString(10)}`
        );

    },

    initializeStakeContract: async function ( stakeAddress, ost, tokenDeployer, initialDepositors, initialStakes, initialValidators) {
       let  stake = await Stake.at(stakeAddress);


        await StakeUtils.approveTransfers(
             stakeAddress,
             ost,
             tokenDeployer,
             initialDepositors,
             initialStakes,
        );
        await stake.initialize(
             initialDepositors,
             initialValidators,
             initialStakes,
        );
    }

};

module.exports = new Utils();
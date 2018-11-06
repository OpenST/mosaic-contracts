const MetaBlockUtils = require('../../../test_lib/meta_block.js')
const EventsDecoder = require('../../../test_lib/event_decoder.js');
const web3 = require('../../../test_lib/web3.js');
const BN = require('bn.js');
const StakeUtils = require('../../stake/helpers/stake_utils.js');
const Stake = artifacts.require('Stake');

const Utils = function () {
};


Utils.prototype = {

    verifyVote: async function (
         stakeAmount,
         validator,
         vote,
         originCore,
         kernelHash,
         expectedVerifiedWeight,
         requiredWeight
    ) {

        validator = web3.utils.toChecksumAddress(validator);

        let sig = await MetaBlockUtils.signVote(validator, vote);

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
             expectedVerifiedWeight.eq(new BN(events.VoteVerified.verifiedWeight)),
             `actual total weight ${expectedVerifiedWeight.toString(10)}` +
             `and expected total weight ${events.VoteVerified.verifiedWeight.toString(10)}`
        );

        assert(
             requiredWeight.eq(new BN(events.VoteVerified.requiredWeight)),
             `actual required weight ${requiredWeight.toString(10)}` +
             ` and expected required weight ${events.VoteVerified.requiredWeight.toString(10)}`
        );

        return events;
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
    },

    assertCommitMetaBlock: function(
         events,
        height,
        kernelHash,
        transitionHash,
        metaBlockHash,
        requiredWeight,
        verifiedWeight
    ) {


        assert(
             events.MetaBlockCommitted !== undefined,
             `Commit meta-block event not emitted`
        );
        assert.equal(
             events.MetaBlockCommitted.height,
             height,
             `Committed meta-block height ${events.MetaBlockCommitted.height} is `
             + `is different from expected height ${1} `
        );

        assert.equal(
             events.MetaBlockCommitted.kernelHash,
             kernelHash,
             `Committed meta-block kernel hash ${events.MetaBlockCommitted.kernelHash} is `
             + `is different from expected kernel hash ${kernelHash} `
        );

        assert.equal(
             events.MetaBlockCommitted.transitionHash,
             transitionHash,
             `Committed meta-block transition hash ${events.MetaBlockCommitted.transitionHash} is `
             + `is different from expected transition hash ${transitionHash} `
        );

        assert.equal(
             events.MetaBlockCommitted.metaBlockHash,
             metaBlockHash,
             `Committed meta-block metaBlockHash  ${events.MetaBlockCommitted.metaBlockHash} is `
             + `is different from expected metaBlockHash  ${metaBlockHash} `
        );

        assert(
             requiredWeight.eq(new BN(events.MetaBlockCommitted.requiredWeight)),
             `actual required weight ${requiredWeight.toString(10)}` +
             ` and expected required weight ${events.MetaBlockCommitted.requiredWeight.toString(10)}`
        );

        assert(
             verifiedWeight.eq(new BN(events.MetaBlockCommitted.verifiedWeight)),
             `actual verified weight ${verifiedWeight.toString(10)}` +
             ` and expected verified weight ${events.MetaBlockCommitted.verifiedWeight.toString(10)}`
        )
    }
};

module.exports = new Utils();

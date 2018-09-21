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
// Test: Core.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('web3'),
    Bignumber = require("bignumber.js");

const Gateway = artifacts.require("Gateway"),
    MockToken = artifacts.require("MockToken");

const GatewayUtilsKlass = require("../../../test/gateway/gateway/gateway_utils"),
    utils = require("../../../test/lib/utils"),
    Helper = require("../../../test/gateway/gateway/helper");

const gatewayUtils = new GatewayUtilsKlass();
const InitiateGatewayLink = function(){};

let mockToken,
    gateway,
    gatewayHelper,
    nonce,
    intentHash,
    signData,
    txOption,
    sender,
    typeHash,
    coGatewayAddress,
    hashLock,
    organisationAddress,
    bounty,
    facilitator;

InitiateGatewayLink.prototype = {
    initiateGatewayLink: async function (resultType) {
        let params = {
            coGateway: coGatewayAddress,
            intentHash: intentHash,
            nonce: nonce,
            sender: sender,
            hashLock: hashLock.l,
            signature: signData.signature
        };

        let expectedResult = {
            returns: {messageHash: signData.digest},
            events: {
                GatewayLinkInitiated: {
                    _messageHash: signData.digest,
                    _gateway: gateway.address,
                    _cogateway: coGatewayAddress,
                    _token: mockToken.address,
                }
            }
        };

        await gatewayUtils.initiateGatewayLink(
            params,
            resultType,
            expectedResult,
            txOption
        );
    },

    perform: function (accounts) {

        const oThis = this;

        const tokenName = "MockToken",
            tokenSymbol = "MOCK",
            tokenDecimals = 18;

        beforeEach(async function() {
            organisationAddress = accounts[2],
            bounty = new Bignumber(100),
            facilitator = accounts[4];
            hashLock = utils.generateHashLock();

            // deploy Mocktoken
            coGatewayAddress = accounts[3];

            mockToken = await MockToken.new();

            let deploymentParams = {
                token: mockToken.address,
                bountyToken: mockToken.address,
                core: accounts[1],
                bounty: bounty,
                organisation: organisationAddress
            };

            // deploy gateway
            gateway = await gatewayUtils.deployGateway(
                deploymentParams,
                utils.ResultType.SUCCESS
            );

            // gateway helper.
            gatewayHelper = new Helper(gateway);

            typeHash = await gatewayHelper.gatewayLinkTypeHash();

            sender = organisationAddress;
            nonce = await gatewayHelper.getNonce(sender);

            intentHash = await gatewayHelper.hashLinkGateway(
                gateway.address,
                coGatewayAddress,
                bounty,
                tokenName,
                tokenSymbol,
                tokenDecimals,
                nonce,
                mockToken.address
            );

            signData = await utils.signHash(
                typeHash,
                intentHash,
                nonce,
                new Bignumber(0),
                new Bignumber(0),
                sender);

            txOption = {
                from: facilitator
            };
        });

        it('fails when CoGateway is 0', async function() {
            coGatewayAddress = 0;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when sender is 0', async function() {
            sender = 0;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when signature is 0', async function() {
            signData.signature = 0;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when signature length is not 65', async function() {
            signData.signature = hashLock.s;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when nonce is does not match the nonce in contract',
            async function() {
                nonce = new Bignumber(2);
                await oThis.initiateGatewayLink(utils.ResultType.FAIL);
            }
        );

        it('fails when sender is not the signer', async function() {
            sender = accounts[8];
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when intent hash is invalid', async function() {
            intentHash = hashLock.s;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('fails when signature is invalid', async function() {
            let sign = await utils.signHash(
                typeHash,
                hashLock.s,
                nonce,
                new Bignumber(0),
                new Bignumber(0),
                sender);
            signData.signature = sign.signature;
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });

        it('Successfully initiates Gateway linking', async function() {
            await oThis.initiateGatewayLink(utils.ResultType.SUCCESS);
            await oThis.initiateGatewayLink(utils.ResultType.FAIL);
        });
    }
};

module.exports = InitiateGatewayLink;

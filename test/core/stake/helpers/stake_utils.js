// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const StakeUtils = function () {};

/**
 * Approves all transfers from the given senders of the given amounts to
 * the given receiver. It transfers the tokens from the treasury to
 * the senders so that they have the value available in the ERC20 token.
 *
 * @param {string} receiver The address that will receive the amounts.
 * @param {Object} token The token used for staking.
 * @param {string} treasury The address that will send the ERC20 tokens to
 *                           the depositors. Usually the address that
 *                           deployed the token contract.
 * @param {array} senders An array of addresses that will deposit stake.
 * @param {array} amounts An array of amounts that the senders will deposit.
 */
StakeUtils.prototype.approveTransfers = async function (
  receiver,
  token,
  treasury,
  senders,
  amounts,
) {
  const count = senders.length;
  for (let i = 0; i < count; i++) {
    const sender = senders[i];
    const amount = amounts[i];

    await token.transfer(sender, amount, { from: treasury });
    await token.approve(receiver, amount, { from: sender });
  }
};

/**
 * Approves all transfers and then calls initialize on the stake contract.
 *
 * @param {Object} stake The stake contract.
 * @param {Object} token The token used for staking.
 * @param {string} treasury The address that will send the ERC20 tokens to
 *                           the depositors. Usually the address that
 *                           deployed the token contract.
 * @param {array} senders An array of addresses that will deposit stake.
 * @param {array} amounts An array of amounts that the senders will deposit.
 */
StakeUtils.prototype.initializeStake = async function (
  stake,
  token,
  treasury,
  senders,
  amounts,
) {
  await this.approveTransfers(
    stake.address,
    token,
    treasury,
    senders,
    amounts,
  );

  // For testing purposes, register the depositors also as the
  // validators.
  await stake.initialize(senders, senders, amounts);
};

/**
 * Deposits the given amount of the given erc20 token from the given
 * address in the given stake contract.
 *
 * @param {Object} erc20 The token to send.
 * @param {Object} stake The staking contract.
 * @param {string} address The address of the validator.
 * @param {BN} amount The amount to deposit.
 */
StakeUtils.prototype.deposit = async function (erc20, stake, address, amount) {
  await erc20.approve(stake.address, amount);
  const tx = await stake.deposit(address, amount);

  return tx;
};

module.exports = new StakeUtils();

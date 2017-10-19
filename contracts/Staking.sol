pragma solidity ^0.4.17;

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
// Staking
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./OpsManaged.sol";
import "./StakingData.sol";

/**
   @title Staking
   @notice Enables staking tokens on a value chain to make use of utility tokens on a utility chain
*/
contract Staking is OpsManaged, StakingData {
    using SafeMath for uint256;

    event UtilityTokenRegistered(bytes32 indexed _uuid, string _symbol, string _name, uint8 _decimals, uint _conversionRate, bytes32 _chainId, address indexed _stakingAccount);
    event UtilityTokenStakingAccountSet(bytes32 indexed _uuid, address _newStakingAccount);
    event MintingIntentDeclared(bytes32 indexed _uuid, address indexed _staker, uint256 _stakerNonce, uint256 _amountST, uint256 _amountUT, uint256 _escrowUnlockHeight, bytes32 _mintingIntentHash /* redundant for abundance of clarity for MVU */);
    event Staked(bytes32 indexed _uuid, address indexed _staker, uint256 _amountST, uint256 _amountUT);
    event UnstakingIntentConfirmed(bytes32 indexed _uuid, bytes32 _unstakingIntentHash);
    event Unstaked(bytes32 indexed _uuid, address indexed _unstaker, uint256 _amount);

	function Staking(EIP20Interface _eip20Token) OpsManaged() public {
		eip20Token = _eip20Token;
	}

	// TBD: move to a parent contract because this is identical to `hashIntent` in Staking?
	function hashIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight
	)
	public
	pure
	returns (bytes32) {
		return keccak256(_uuid, _account, _accountNonce, _amountST, _amountUT, _escrowUnlockHeight);
	}

	// @dev `_chainId` should be blank for MVU
	// @dev `_stakingAccount` is optional
	function registerUtilityToken(
		string _symbol,
		string _name,
		uint8 _decimals,
		uint _conversionRate,
		bytes32 _chainId,
		address _stakingAccount
	)
	public onlyAdmin returns (bool, bytes32) {
		require(bytes(_name).length > 0);
		require(bytes(_symbol).length > 0);
		require(_decimals > 0);
		require(_conversionRate > 0);

		bytes32 uuid = keccak256(_name, _chainId);

		// Confirm that UUID has not already been registered
		require(utilityTokens[uuid].conversionRate == 0);

		utilityTokens[uuid] = UtilityToken({
			symbol:			_symbol,
			name:			_name,
			decimals:		_decimals,
			conversionRate:	_conversionRate,
			chainId:		_chainId,
			stakedST:		0,
			stakingAccount:	_stakingAccount
		});

		UtilityTokenRegistered(uuid, _symbol, _name, _decimals, _conversionRate, _chainId, _stakingAccount);

		return (true, uuid);
	}
	
	// 2 step like ownership --> Yes
	// If this is 0, it cannot be set to non-0
	function setUtilityTokenStakingAccount(bytes32 _uuid, address _newStakingAccount) public returns (bool) {
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);
		require(_newStakingAccount != address(0));

		// TODO;
	}

	function stake(bytes32 _uuid, uint256 _amountST) external returns (bool, uint256) {
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);
		require(_amountST > 0);

		UtilityToken storage utilityToken = utilityTokens[_uuid];

		if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);
		require(eip20Token.transferFrom(msg.sender, address(this), _amountST));

		uint256 amountUT = _amountST.mul(utilityToken.conversionRate);
		uint256 escrowUnlockHeight = block.number + BLOCKS_TO_WAIT;
		bytes32 mintingIntentHash = hashIntent(
			_uuid,
			msg.sender,
			nonces[msg.sender],
			_amountST,
			amountUT,
			escrowUnlockHeight
		);
		utilityToken.stakes[mintingIntentHash] = Stake({
			staker: 			msg.sender,
			amountST: 			_amountST,
			amountUT: 			amountUT,
			escrowUnlockHeight: escrowUnlockHeight,
			granter: 			address(0)
		});

		MintingIntentDeclared(
			_uuid,
			msg.sender,
			nonces[msg.sender],
			_amountST,
			amountUT,
			escrowUnlockHeight,
			mintingIntentHash
		);

		nonces[msg.sender]++;

		return (true, amountUT);
	}

	// TODO: Come back to this
	// when calling hashIntent, make sure the beneficiary is passed in as _staker
	// if _uuid == a branded token, require(msg.sender == adminAddress) && require(_beneficiary == utilityTokens[_uuid].stakingAccount)
	// requires(eip20Token.transferFrom(_beneficiary, this, _amount))
	// Calls hashIntent
	// Adds Stake to stakes
	// Emits event: MintingIntentDeclared
	function stakeFor(address _beneficiary, bytes32 _uuid, uint256 _amountST) external returns (bool, uint256) {
		require(_beneficiary != address(0));
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);
		require(_amountST > 0);

		// TODO;
	}

	// @dev Checks msg.sender for purposes of MVU
	// TBD: don't delete Stake after processing?
	function processStaking(bytes32 _uuid, bytes32 _mintingIntentHash) external returns (bool) {
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);
		require(_mintingIntentHash != "");
		require(utilityTokens[_uuid].stakes[_mintingIntentHash].staker == msg.sender);

		Stake storage stake = utilityTokens[_uuid].stakes[_mintingIntentHash];
		utilityTokens[_uuid].stakedST = utilityTokens[_uuid].stakedST.add(stake.amountST);

		Staked(_uuid, stake.staker, stake.amountST, stake.amountUT);

		delete utilityTokens[_uuid].stakes[_mintingIntentHash];

		return true;
	}

	function unstake(
		bytes32 _uuid,
		address _unstaker,
		uint256 _unstakerNonce,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight,
		bytes32 _unstakingIntentHash
	) external returns (bool) {
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);		
		require(nonces[_unstaker] < _unstakerNonce);
		require(_amountST > 0);
		require(_amountUT > 0);
		require(_escrowUnlockHeight > 0);
		require(_unstakingIntentHash != "");

		bytes32 unstakingIntentHash = hashIntent(
			_uuid,
			_unstaker,
			nonces[_unstaker],
			_amountST,
			_amountUT,
			_escrowUnlockHeight
		);

		require(_unstakingIntentHash == unstakingIntentHash);

		utilityTokens[_uuid].unstakes[unstakingIntentHash] = Unstake({
			unstaker: _unstaker,
			amount: _amountST
		});
		nonces[_unstaker]++;

		UnstakingIntentConfirmed(_uuid, unstakingIntentHash);

		return true;
	}

	// TBD: don't delete Unstake after processing?
	function processUnstaking(bytes32 _uuid, bytes32 _unstakingIntentHash) public returns (bool) {
		require(_uuid != "");
		require(utilityTokens[_uuid].conversionRate > 0);
		require(_unstakingIntentHash != "");

		Unstake storage unstake = utilityTokens[_uuid].unstakes[_unstakingIntentHash];
		utilityTokens[_uuid].stakedST = utilityTokens[_uuid].stakedST.sub(unstake.amount);

		Unstaked(_uuid, unstake.unstaker, unstake.amount);

		require(eip20Token.transfer(unstake.unstaker, unstake.amount));

		delete utilityTokens[_uuid].unstakes[_unstakingIntentHash];

		return true;
	}
}

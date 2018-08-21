pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
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
// Value Chain: Gateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "./WorkersInterface.sol";
import "./EIP20Interface.sol";
import "./SimpleStake.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./HasherV1.sol";

/**
 * @title Gateway Contract
 *
 *  @notice Gateway contract is staking Gateway that separates the concerns of staker and staking processor.
 *          Stake process is executed through Gateway contract rather than directly with the protocol contract.
 *          The Gateway contract will serve the role of staking account rather than an external account.
 *
 */
contract GatewayV1 {

	/* Events */

	event  StakeRequestedEvent(
		bytes32 _messageHash,
		uint256 _amount,
		uint256 _fee,
		address _beneficiary,
		address _staker,
		bytes32 _intentHash
	);

	event StakeProcessed(
		bytes32 _messageHash,
		uint256 _amount,
		address _beneficiary,
		uint256 _fee
	);

	/* Struct */
	/**
	 *  It denotes the stake request.
	 *  Status values could be :-
	 *  0 :- amount used for staking
	 *  1 :- beneficiary is the address in the target chain where token will be minted.
	 *  2 :- fee is the amount rewarded to facilitator after successful stake and mint.
	 */
	struct StakeRequest {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}
	/* Storage */

	// It is a hash used to represent operation type.
	bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,uint256 fee)"
		)
	);

	//uuid of branded token.
	bytes32 public uuid;
	//Escrow address to lock staked fund.
	address stakeVault;
	//Amount in BT which is staked by facilitator.
	uint256 public bounty;
	//White listed addresses which can act as facilitator.
	WorkersInterface public workers;
	//address of branded token.
	EIP20Interface public brandedToken;
	//address of core contract.
	CoreInterface core;
	//It stores the nonces for each staker.
	mapping(address/*staker*/ => uint256) nonces;
	//It stores message used by message bus.
	mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;
	MessageBus.MessageBox messageBox;
	mapping(bytes32 => StakeRequest) stakeRequests;

	/**
	 *  @notice Contract constructor.
	 *
	 *  @param  _uuid UUID of utility token.
	 *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
	 *  @param _workers Workers contract address.
	 *  @param _brandedToken Branded token contract address.
	 *  @param _core Core contract address.
	 */
	constructor(
		bytes32 _uuid,
		uint256 _bounty,
		WorkersInterface _workers,
		EIP20Interface _brandedToken,
		CoreInterface _core
	)
	{
		//todo generate uuid from branded Token ?
		require(_uuid != bytes32(0));
		require(_workers != address(0));
		require(_brandedToken != address(0));
		require(_core != address(0));

		uuid = _uuid;
		bounty = _bounty;
		workers = _workers;
		brandedToken = _brandedToken;
		core = _core;
		stakeVault = new SimpleStake(brandedToken, address(this), uuid);
	}
	/* Public functions */

	/**
	 * @notice external function stake
	 *
	 * @dev In order to stake the staker needs to approve Gateway contract for stake amount.
     *   Staked amount is transferred from staker address to Gateway contract.
	 *
	 * @param _amount Staking amount.
	 * @param _beneficiary Beneficiary address.
	 * @param _staker Staker address.
	 * @param _gasPrice Gas price
	 * @param _fee Fee for facilitation of stake process.
	 * @param _nonce Staker nonce.
	 * @param _hashLock Hash Lock
	 * @param _signature Signature signed by staker.
	 *
	 * @return messageHash_ which is unique for each request.
	 */
	function stake(
		uint256 _amount,
		address _beneficiary,
		address _staker,
		uint256 _gasPrice,
		uint256 _fee,
		uint256 _nonce,
		bytes32 _hashLock,
		bytes _signature
	)
	external
	returns (bytes32 messageHash_)
	{
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length != 0);
		require(nonces[msg.sender] == _nonce);

		nonces[msg.sender]++;

		bytes32 intentHash = HasherV1.intentHash(_amount, _beneficiary, _staker, _gasPrice, _fee);

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _nonce, _gasPrice);

		messages[messageHash_] = MessageBus.Message({
			intentHash : intentHash,
			nonce : _nonce,
			gasPrice : _gasPrice,
			signature : _signature,
			sender : _staker,
			hashLock : _hashLock
			});

		stakeRequests[messageHash_] = StakeRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
			});

		MessageBus.declareMessage(messageBox, STAKE_REQUEST_TYPEHASH, messages[messageHash_]);
		//transfer staker amount to gateway
		require(brandedToken.transferFrom(_staker, this, _amount));
		//transfer bounty to gateway
		require(brandedToken.transferFrom(msg.sender, this, bounty));

		emit StakeRequestedEvent(
			messageHash_,
			_amount,
			_fee,
			_beneficiary,
			_staker,
			intentHash
		);
	}

	function processStaking(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 stakeRequestAmount)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));
		MessageBus.Message storage message = messages[_messageHash];

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		stakeRequestAmount = stakeRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, STAKE_REQUEST_TYPEHASH, messages[_messageHash], _unlockSecret);

		require(EIP20Interface(brandedToken).transfer(stakeVault, stakeRequestAmount));

		//return bounty
		require(EIP20Interface(brandedToken).transfer(msg.sender, bounty));

		emit StakeProcessed(
			_messageHash,
			stakeRequests[_messageHash].amount,
			stakeRequests[_messageHash].beneficiary,
			stakeRequests[_messageHash].fee
		);
		delete stakeRequests[_messageHash];
		delete messages[_messageHash];
		//todo discuss not delete due to revocation message
		//delete messageBox.outbox[_messageHash];

	}

}

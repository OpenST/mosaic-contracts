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
// Utility Token
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./EIP20Token.sol";
import "./UtilityTokenData.sol";

/**
   @title UtilityToken
   @notice Represents utility tokens on a utility chain that are backed by crypto-assets staked on a value chain
*/
contract UtilityToken is EIP20Token, UtilityTokenData {
    using SafeMath for uint256;

    event UnstakingIntentDeclared(bytes32 indexed _uuid, address indexed _unstaker, uint256 _unstakerNonce, uint256 _amountUT, uint256 _escrowUnlockHeight, bytes32 _unstakingIntentHash /* redundant for abundance of clarity for MVU */);
    event Redeemed(bytes32 indexed _uuid, address indexed _account, uint256 _amount, uint256 _balance, uint256 _totalSupply);
    event MintingIntentConfirmed(bytes32 indexed _uuid, bytes32 _mintingIntentHash);
    event Minted(bytes32 indexed _uuid, address indexed _account, uint256 _amount, uint256 _balance, uint256 _totalSupply);

	// TODO: ERC20Token contract that does not take a total supply constructor param
	function UtilityToken(string _symbol, string _name, uint8 _decimals, bytes32 _chainId)
		EIP20Token(_symbol, _name, _decimals)
		public {
		require(bytes(_symbol).length > 0);
		require(bytes(_name).length > 0);
		require(_decimals > 0);

		uuid = keccak256(_name, _chainId);
	}

	function hashMintingIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight
	)
	public pure returns (bytes32) {
		return keccak256(_uuid, _account, _accountNonce, _amountST, _amountUT, _escrowUnlockHeight);
	}

	function hashUnstakingIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight
	)
	public pure returns (bytes32) {
		return keccak256(_uuid, _account, _accountNonce, _amountUT, _escrowUnlockHeight);
	}

	// @dev There's no need for msg.sender to approve this contract to transfer
	// 		because calling `transfer` from `redeem` has the same msg.sender
	// TODO redeem needs user nonce from staking contract as parameter
	//      and must be strictly greater than stored nonce in UtilityToken
	function redeem(uint256 _amountUT) public returns (bool) {
		require(_amountUT > 0);
		require(transfer(address(this), _amountUT));

		uint256 escrowUnlockHeight = block.number + BLOCKS_TO_WAIT_LONG;
		bytes32 unstakingIntentHash = hashUnstakingIntent(
			uuid,
			msg.sender,
			nonces[msg.sender],
			_amountUT,
			escrowUnlockHeight
		);

		nonces[msg.sender]++;

		redemptions[unstakingIntentHash] = Redemption({
			redeemer: 			msg.sender,
			amountUT: 			_amountUT,
			escrowUnlockHeight: escrowUnlockHeight
		});

		UnstakingIntentDeclared(
			uuid,
			msg.sender,
			nonces[msg.sender],
			_amountUT,
			escrowUnlockHeight,
			unstakingIntentHash
		);

		return (true);
	}

	function processRedemption(bytes32 _unstakingIntentHash) public returns (bool) {
		require(_unstakingIntentHash != "");
		require(redemptions[_unstakingIntentHash].redeemer == msg.sender);

		Redemption storage redemption = redemptions[_unstakingIntentHash];
		tokenTotalSupply = tokenTotalSupply.sub(redemption.amountUT);
		balances[address(this)] = balances[address(this)].sub(redemption.amountUT);

		Redeemed(uuid, redemption.redeemer, redemption.amountUT, balances[redemption.redeemer], tokenTotalSupply);

		delete redemptions[_unstakingIntentHash];

		return true;
	}

	function mint(
		bytes32 _uuid,
		address _minter,
		uint256 _minterNonce,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight,
		bytes32 _mintingIntentHash
	) external returns (bool) {
		require(_uuid == uuid);
		require(nonces[_minter] < _minterNonce);
		require(_amountST > 0);
		require(_amountUT > 0);
		require(_escrowUnlockHeight > 0);
		require(_mintingIntentHash != "");

		nonces[_minter] = _minterNonce;

		bytes32 mintingIntentHash = hashMintingIntent(
			_uuid,
			_minter,
			_minterNonce,
			_amountST,
			_amountUT,
			_escrowUnlockHeight
		);

		require(_mintingIntentHash == mintingIntentHash);

		mints[mintingIntentHash] = Mint({
			minter: _minter,
			amount: _amountUT
		});

		MintingIntentConfirmed(_uuid, mintingIntentHash);

		return true;
	}

	function processMinting(bytes32 _mintingIntentHash) external returns (bool) {
		require(_mintingIntentHash != "");

		Mint storage mint = mints[_mintingIntentHash];
		balances[mint.minter] = balances[mint.minter].add(mint.amount);
		tokenTotalSupply = tokenTotalSupply.add(mint.amount);

		Minted(uuid, mint.minter, mint.amount, balances[mint.minter], tokenTotalSupply);

		delete mints[_mintingIntentHash];

		return true;
	}
}

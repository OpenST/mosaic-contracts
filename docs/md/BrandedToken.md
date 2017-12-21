# OpenST Protocol Documentation

## BrandedToken


An EIP20 token minted by staking Simple Token on Ethereum mainnet. Branded tokens are designed to be used within a (decentralised) application and support: smart contract controlled password reset for users who don't yet (hard-spoon FTW) manage their own private keys (+v0.9.2); soft-exit for a user to redeem their equivalent part of the Simple Token stake on Ethereum mainnet; hard-exit for all users if the utility chain halts to reclaim their equivalent part of the Simple Token stake on Ethereum (before v1.0)

### Function Summary

Signature | Returns | Details
--- | --- | ---
allowance<br/>(address, address) | remaining | Takes _owner, _spender<br/><br/>Returns remaining allowance of _spender from _owner
approve<br/>(address, uint256) | success | Takes _spender, _value<br/><br/>Approves _spender to transfer _value from msg.sender; emits Approval event
balanceOf<br/>(address) | balance | Takes _owner<br/><br/>Returns balance of _owner
burn<br/>(address, uint256) | bool | Takes _burner, _amount<br/><br/>Calls burnEIP20 and returns the result of calling burnInternal; only callable by protocol
claim<br/>(address) | bool | Takes _beneficiary<br/><br/>Calls claimInternal and returns the result of calling claimEIP20
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
decimals() | uint8 | Returns decimals
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
mint<br/>(address, uint256) | bool | Takes _beneficiary, _amount<br/><br/>Calls mintEIP20 and returns the result of calling mintInternal; only callable by protocol
name() | string | Returns name
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol
symbol() | string | Returns symbol
totalSupply() | uint256 | Get totalTokenSupply as view so that child cannot edit
transfer<br/>(address, uint256) | success | Takes _to, _value<br/><br/>Transfers _value from balance of msg.sender to _to; emits Transfer event
transferFrom<br/>(address, address, uint256) | success | Takes _from, _to, _value<br/><br/>Transfers _value from balance of _from to _to; emits Transfer event
unclaimed<br/>(address) | uint256 | Takes _beneficiary<br/><br/>Returns unclaimed amount for _beneficiary
uuid() | bytes32 | Returns uuid


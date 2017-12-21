# OpenST Protocol Documentation

## EIP20Interface


Interface for EIP20Token

### Function Summary

Signature | Returns | Details
--- | --- | ---
allowance<br/>(address, address) | remaining | Returns remaining allowance of _spender from _owner
approve<br/>(address, uint256) | success | Approves _spender to transfer _value from msg.sender; emits Approval event
balanceOf<br/>(address) | balance | Returns balance of _owner
decimals() | uint8 | Returns decimals
name() | string | Returns name
symbol() | string | Returns symbol
totalSupply() | uint256 | Returns totalSupply
transfer<br/>(address, uint256) | success | Transfers _value from balance of msg.sender to _to; emits Transfer event
transferFrom<br/>(address, address, uint256) | success | Transfers _value from balance of _from to _to; emits Transfer event


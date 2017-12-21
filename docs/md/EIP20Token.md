# OpenST Protocol Documentation

## EIP20Token


Implements EIP20 token

### Function Summary

Signature | Returns | Details
--- | --- | ---
allowance<br/>(address, address) | remaining | Takes _owner, _spender<br/><br/>Returns remaining allowance of _spender from _owner
approve<br/>(address, uint256) | success | Takes _spender, _value<br/><br/>Approves _spender to transfer _value from msg.sender; emits Approval event
balanceOf<br/>(address) | balance | Takes _owner<br/><br/>Returns balance of _owner
decimals() | uint8 | Returns decimals
name() | string | Returns name
symbol() | string | Returns symbol
totalSupply() | uint256 | Returns totalSupply
transfer<br/>(address, uint256) | success | Takes _to, _value<br/><br/>Transfers _value from balance of msg.sender to _to; emits Transfer event
transferFrom<br/>(address, address, uint256) | success | Takes _from, _to, _value<br/><br/>Transfers _value from balance of _from to _to; emits Transfer event


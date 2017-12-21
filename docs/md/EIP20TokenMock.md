# OpenST Protocol Documentation

## EIP20TokenMock


Implements mock totalSupply function and wraps internal functions to enable testing EIP20Token

### Function Summary

Signature | Returns | Details
--- | --- | ---
allowance<br/>(address, address) | remaining | Takes _owner, _spender<br/><br/>Returns remaining allowance of _spender from _owner
approve<br/>(address, uint256) | success | Takes _spender, _value<br/><br/>Approves _spender to transfer _value from msg.sender; emits Approval event
balanceOf<br/>(address) | balance | Takes _owner<br/><br/>Returns balance of _owner
burnEIP20Public<br/>(uint256) | success bool | Public wrapper for burnEIP20Public
claimEIP20Public<br/>(address, uint256) | success bool | Public wrapper for claimEIP20Public
decimals() | uint8 | Returns decimals
mintEIP20Public<br/>(uint256) | success bool | Public wrapper for mintEIP20Public
name() | string | Returns name
symbol() | string | Returns symbol
totalSupply() |  | Mock totalSupply function
transfer<br/>(address, uint256) | success | Takes _to, _value<br/><br/>Transfers _value from balance of msg.sender to _to; emits Transfer event
transferFrom<br/>(address, address, uint256) | success | Takes _from, _to, _value<br/><br/>Transfers _value from balance of _from to _to; emits Transfer event


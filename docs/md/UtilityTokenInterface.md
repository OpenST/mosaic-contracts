# OpenST Protocol Documentation

## UtilityTokenInterface


Interface for UtilityToken

### Function Summary

Signature | Returns | Details
--- | --- | ---
burn<br/>(address, uint256) | success | Takes _burner, _amount<br/><br/>Burns utility tokens after having redeemed them through the protocol for the staked Simple Token
claim<br/>(address) | success | Takes _beneficiary<br/><br/>Transfers full claim to beneficiary
mint<br/>(address, uint256) | success | Takes _beneficiary, _amount<br/><br/>Mints new utility tokens
totalSupply() | supply | Get totalTokenSupply as view so that child cannot edit
uuid() | getUuid | Get unique universal identifier for utility token


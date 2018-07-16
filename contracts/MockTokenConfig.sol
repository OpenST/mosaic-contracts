pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Token Configuration
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


contract MockTokenConfig {

    string  public constant TOKEN_SYMBOL   = "MOCK";
    string  public constant TOKEN_NAME     = "Mock Token";
    uint8   public constant TOKEN_DECIMALS = 18;

    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKENS_MAX     = 800000000 * DECIMALSFACTOR;
}

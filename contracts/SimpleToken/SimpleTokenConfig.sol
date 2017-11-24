pragma solidity ^0.4.17;

// ----------------------------------------------------------------------------
// Token Configuration
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


contract SimpleTokenConfig {

    string  public constant TOKEN_SYMBOL   = "ST";
    string  public constant TOKEN_NAME     = "Simple Token";
    uint8   public constant TOKEN_DECIMALS = 18;

    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKENS_MAX     = 800000000 * DECIMALSFACTOR;
}

pragma solidity ^0.4.23;

import "./TokenConversionLib.sol";

library TokenConversionLibTest {

    /**
     *	@notice Calculate utility token amount based on value token amount, conversion rate and conversion decimal
     *
     *	@param amount of value token needs to be converted to UT.
     *	@param conversionRate rate which is used to convert value token to utility token.
     *	@param conversionRateDecimals represents number of decimal in conversion rate.
     *
     *	@return amountUT amount of utility Token which is converted from value token given the conversion rate.
     */

    function calculateUTAmount(
        uint256 amount,
        uint256 conversionRate,
        uint8 conversionRateDecimals)
        public
        pure
        returns(
        uint256)
    {

        return TokenConversionLib.calculateUTAmount(amount, conversionRate, conversionRateDecimals);
    }

    /**
      *	@notice Calculate Value token amount based on utility token amount, conversion rate and conversion decimal.
      *
      *	@param amount  of UT will be converted to value token.
      *	@param conversionRate rate which is used to convert utility token to value token.
      *	@param conversionRateDecimals represents number of decimal in conversion rate.
      *
      *	@return amountVT number of value tokens which is converted from amountUT given the conversion rate.
      */

    function calculateVTAmount(
        uint256 amount,
        uint256 conversionRate,
        uint8 conversionRateDecimals)
        public
        pure
        returns(
        uint256)
    {
        return TokenConversionLib.calculateVTAmount(amount, conversionRate, conversionRateDecimals);
    }
}

pragma solidity ^0.4.23;

import "./TokenConversion.sol";

library TokenConversionTest {

    /**
     *	@notice Calculate utility token amount based on value token amount, conversion rate and conversion decimal
     *
     *	@param amount It is amount of value token should be converted to UT.
     *	@param conversionRate Rate which is used to convert value token to utility token.
     *	@param conversionRateDecimals It represents number of decimal in conversion rate.
     *
     *	@return amountUT Amount of utility token which is converted from value token given the conversion rate.
     */
    function calculateUTAmount(
        uint256 amount,
        uint256 conversionRate,
        uint8 conversionRateDecimals
    )
        internal
        pure
        returns(uint256 /*amountUT*/)
    {
        return TokenConversion.calculateUTAmount(amount, conversionRate, conversionRateDecimals);
    }

    /**
     *	@notice Calculate value token amount based on utility token amount, conversion rate and conversion decimal.
     *
     *	@param amount It is amount of UT should be converted to value token.
     *	@param conversionRate Rate which is used to convert utility token to value token.
     *	@param conversionRateDecimals It represents number of decimal in conversion rate.
     *
     *	@return amountVT Amount of value tokens which is converted from utility token given the conversion rate.
     */
    function calculateVTAmount(
        uint256 amount,
        uint256 conversionRate,
        uint8 conversionRateDecimals
    )
        internal
        pure
        returns(uint256 /*amountVT*/)
    {
        return TokenConversion.calculateVTAmount(amount, conversionRate, conversionRateDecimals);
    }
}

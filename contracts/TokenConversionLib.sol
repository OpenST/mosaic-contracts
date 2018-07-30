pragma solidity 0.4.23;

import "./SafeMath.sol";

library TokenConversionLib {
    using SafeMath for uint256;

    /**
     *	@notice Calculate Utility token amount based on value token amount, conversion rate and conversion decimal
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
        internal
        pure
        returns(
        uint256 amountUT)
    {
        require(conversionRate > 0, 'Conversion Rate should be greater than zero');

        amountUT = (amount.mul(conversionRate)).div(10 ** uint256(conversionRateDecimals));
        return amountUT;
    }

    /**
      *	@notice Calculate Value token amount based on utility token amount, conversion rate and conversion decimal.
      *
      *	@param amount of UT will be converted to value token.
      *	@param conversionRate rate which is used to convert utility token to value token.
      *	@param conversionRateDecimals represents number of decimal in conversion rate.
      *
      *	@return amountVT number of value tokens which is converted from amountUT given the conversion rate.
      */

    function calculateVTAmount(
        uint256 amount,
        uint256 conversionRate,
        uint8 conversionRateDecimals)
        internal
        pure
        returns(
        uint256 amountVT)
    {
        require(conversionRate > 0, 'Conversion Rate should be greater than zero');

        amountVT = (amount.mul(10 ** uint256(conversionRateDecimals))).div(conversionRate);
        return amountVT;
    }
}

pragma solidity 0.4.23;

import "./SafeMath.sol";

library TokenConversionLib {
    using SafeMath for uint256;

    /**
     *	@notice Calculate Utility token amount based on stake OST amount, conversion rate and conversion decimal
     *
     *	@param amountST amount of ST needs to be staked and converted to UT
     *	@param conversionRate rate which is used to convert ST to UT
     *	@param conversionRateDecimals represents number of decimal in conversion rate
     *
     *	@return  amountUT number of utility token which can be minted from given amountST
     */

    function calculateUTAmount(
        uint256 amountST,
        uint256 conversionRate,
        uint8 conversionRateDecimals)
        internal
        pure
        returns(
        uint256 amountUT)
    {
        require(amountST > 0, 'Amount that needs to be converted should be greater than zero');
        require(conversionRate > 0, 'Conversion Rate should be greater than zero');

        amountUT = (amountST.mul(conversionRate)).div(10 ** uint256(conversionRateDecimals));
        return amountUT;
    }

    /**
      *	@notice Calculate Simple token amount based on unstake BT amount, conversion rate and conversion decimal
      *
      *	@param amountUT amount of UT needs to be unstaked and converted to ST
      *	@param conversionRate rate which is used to convert UT to ST
      *	@param conversionRateDecimals represents number of decimal in conversion rate
      *
      *	@return amountST number of ST token which can be unstaked from given amountUT
      */

    function calculateSTAmount(
        uint256 amountUT,
        uint256 conversionRate,
        uint8 conversionRateDecimals)
        internal
        pure
        returns(
        uint256 amountST)
    {
        require(amountUT > 0, 'Amount that needs to be converted should be greater than zero');
        require(conversionRate > 0, 'Conversion Rate should be greater than zero');

        amountST = (amountUT.mul(10 ** uint256(conversionRateDecimals))).div(conversionRate);
        return amountST;
    }
}

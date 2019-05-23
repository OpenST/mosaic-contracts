pragma solidity ^0.5.0;

import "../../gateway/OSTComposer.sol";
import "../../gateway/StakerProxy.sol";

contract MockOSTComposer is OSTComposer {

    constructor(
        OrganizationInterface _organization
    )
        OSTComposer(_organization)
        public
    {

    }

    function setStakeRequestHash(
        bytes32 _stakeRequestHash,
        address _staker,
        address _gateway
    )
        public
    {
        stakeRequestHashes[_staker][_gateway] = _stakeRequestHash;
    }

    function setStakeRequests(
        address _staker,
        address _gateway,
        uint256 _amount,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _beneficiary,
        uint256 _nonce,
        bytes32 _stakeHash
    )
        public
    {
        stakeRequests[_stakeHash] = StakeRequest({
            amount: _amount,
            beneficiary: _beneficiary,
            gasPrice: _gasPrice,
            gasLimit: _gasLimit,
            nonce: _nonce,
            staker: _staker,
            gateway: _gateway
        });
    }

    function setStakerProxy(
        address _staker,
        StakerProxy _stakerProxy
    )
        public
    {
        stakerProxies[_staker] = _stakerProxy;
    }

    function setActiveStakeRequestCount(
        address staker,
        uint256 count
    )
        public
    {
        activeStakeRequestCount[staker] = count;
    }

    function generateStakerProxy(address payable _staker) public returns(StakerProxy) {
        StakerProxy _stakerProxy = new StakerProxy(_staker);
        stakerProxies[_staker] = _stakerProxy;
        return stakerProxies[_staker];
    }
}

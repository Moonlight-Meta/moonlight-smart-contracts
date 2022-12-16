// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../main/OrderStructs.sol";

interface IMarketWrapper {

    struct MarketWrapperConstructorParameters {
        BasicOrderParameters orderParams;
        uint256 buyNowPrice;
        address marketPlace;
    }

    receive() external payable;

    fallback() external payable;

    function grantOwnerRole(address _to) external;

    function getBuyNowPrice() external returns (uint256);

    function emergencyWithdrawal(address payable _to) external payable;

    function migration(
        MarketWrapperConstructorParameters calldata params_
    ) external;

    function buyNow() external payable returns (bool);
}

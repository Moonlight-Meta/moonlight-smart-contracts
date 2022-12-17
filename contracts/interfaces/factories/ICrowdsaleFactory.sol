// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../main/OrderStructs.sol";

interface ICrowdsaleFactory {

    function grantOwnerRole(address to) external;

    function newMoonSale(
        uint256 _rate,
        uint256 _closingTime,
        address tokenAddress,
        MarketWrapperConstructorParameters calldata _params
    ) external returns (address);

    function migration(
        uint256 _newClosingTime,
        string memory _fractionalUri,
        address sale,
        MarketWrapperConstructorParameters calldata _params
    ) external;
}

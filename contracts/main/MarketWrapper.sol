// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper {
    uint256 public buyNowPrice;
    address public marketPlace;
    bytes public transactionData;
    uint256 public gasEstimate;

    event Purchased(bool success);

    constructor(
        uint256 _buyNowPrice,
        uint256 _gasEstimate,
        address _marketPlace,
        bytes memory _transactionData
    ) AMarketWrapper() {
        buyNowPrice = _buyNowPrice;
        marketPlace = _marketPlace;
        transactionData = _transactionData;
        gasEstimate = _gasEstimate;
    }

    function getBuyNowPrice() external view override returns (uint256) {
        return buyNowPrice;
    }

    function setBuyNowPrice(
        uint256 _price
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        buyNowPrice = _price;
    }

    function setGasEstimate(
        uint256 _gasEstimate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        gasEstimate = _gasEstimate;
    }

    function setTransactionData(
        bytes memory _transactionData
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transactionData = _transactionData;
    }

    function migration(
        uint256 _price,
        uint256 _gasEstimate,
        address _marketPlace,
        bytes memory _transactionData
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        buyNowPrice = _price;
        marketPlace = _marketPlace;
        transactionData = _transactionData;
        gasEstimate = _gasEstimate;
    }

    function buyNow()
        external
        payable
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (bool)
    {
        require(address(this).balance >= buyNowPrice);

        (bool success, ) = marketPlace.call{
            value: buyNowPrice,
            gas: gasEstimate
        }(transactionData);
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }
}

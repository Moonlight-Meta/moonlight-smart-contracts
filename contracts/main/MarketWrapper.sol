// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper{
    
    uint256 public buyNowPrice;
    address public marketPlace;
    bytes public transactionData;
    uint256 public gasEstimate;

    event Purchased(bool success);

    constructor(uint256 _buyNowPrice, address _marketPlace, bytes memory _transactionData, uint256 _gasEstimate)
    AMarketWrapper(){
        buyNowPrice = _buyNowPrice;
        marketPlace = _marketPlace;  
        transactionData = _transactionData;
        gasEstimate = _gasEstimate;
    }
    
    function getBuyNowPrice()
    view override external returns (uint256){
        return buyNowPrice;
    }

    function setBuyNowPrice(uint256 _price) override onlyRole(DEFAULT_ADMIN_ROLE) external{
        buyNowPrice = _price;
    }

    function setMarketPlace(address _marketPlace) override onlyRole(DEFAULT_ADMIN_ROLE) external{
        marketPlace = _marketPlace;
    }

    function setTransactionData(BasicOrderParameters memory _transactionData) override onlyRole(DEFAULT_ADMIN_ROLE) external{
        transactionData = abi.encodeWithSignature("fulfillBasicOrder(tuple)", _transactionData);
    }

    function buyNow()
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
        require(address(this).balance >= buyNowPrice);

        (bool success,) = marketPlace.call{value: buyNowPrice, gas: gasEstimate}(transactionData);
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }

}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper{
    
    uint256 buyNowPrice;

    event Purchased(bool success);

    constructor(uint256 _buyNowPrice)
    AMarketWrapper(){
        buyNowPrice = _buyNowPrice;
    }
    

    function getBuyNowPrice()
    view override external returns (uint256){
        return buyNowPrice;
    }

    function setBuyNowPrice(uint256 price) override onlyRole(DEFAULT_ADMIN_ROLE) external{
        buyNowPrice = price;
    }

    function buyNow()
    override external payable onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
        require(address(this).balance == buyNowPrice);
        emit Purchased(true);
        return true;
    }

}
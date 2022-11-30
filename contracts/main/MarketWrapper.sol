// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper{
    
    uint256 public buyNowPrice;
    address public marketPlace;
    string public ethTransactionData;

    event Purchased(bool success);

    constructor(uint256 _buyNowPrice, address _marketPlace, string memory _ethTransactionData)
    AMarketWrapper(){
        buyNowPrice = _buyNowPrice;
        marketPlace = _marketPlace;
        ethTransactionData = _ethTransactionData;
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

    function setEthTransactionData(string memory _ethTransactionData) override onlyRole(DEFAULT_ADMIN_ROLE) external{
        ethTransactionData = _ethTransactionData;
    }

    function buyNow()
    override external payable onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
        require(address(this).balance == buyNowPrice);

        (bool success,) = marketPlace.call{value: buyNowPrice}(bytes(ethTransactionData));
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }

}
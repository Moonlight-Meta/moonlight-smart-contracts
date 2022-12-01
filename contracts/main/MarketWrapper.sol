// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AMarketWrapper.sol";

interface ISeaport{
    function fulfillBasicOrder(BasicOrderParameters memory parameters) external payable returns (bool fulfilled);
}

contract MarketWrapper is AMarketWrapper{
    
    uint256 public buyNowPrice;
    address public marketPlace;
    bytes transactionData;

    event Purchased(bool success);

    constructor(uint256 _buyNowPrice, address _marketPlace, BasicOrderParameters memory _transactionData)
    AMarketWrapper(){
        buyNowPrice = _buyNowPrice;
        marketPlace = _marketPlace;  
        transactionData = abi.encodeWithSignature("fulfillBasicOrder(tuple)", _transactionData);
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
    override external payable onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
        require(address(this).balance == buyNowPrice);

        // ISeaport seaport = ISeaport(marketPlace);
        // (bool success) = seaport.fulfillBasicOrder{value: buyNowPrice}(transactionData);
        // require(success, "Purchase Failed");

        (bool success,) = marketPlace.call{value: buyNowPrice}(transactionData);
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }

}
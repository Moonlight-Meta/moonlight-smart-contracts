// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper{
    constructor()
    AMarketWrapper(){}

    function getBuyNowPrice()
    override external returns (uint256){
        return 56;
    }

    function buyNow()
    override external payable returns (bool){
        return true;
    }

}
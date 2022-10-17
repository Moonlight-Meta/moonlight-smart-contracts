// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/AMarketWrapperFactory.sol";


abstract contract MoonTokenFactory is AMarketWrapperFactory{

    address[] marketWrappers;

    constructor()
    AMarketWrapperFactory()
    {}

    function newMarketWrapper ()
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) 
    {
        MarketWrapper newWrapper = new MarketWrapper();
        marketWrappers.push(address(newWrapper));
        return address(newWrapper);
    }

    function giveContractOwnership(address _marketWrapper, address _to) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)
    {   
        MarketWrapper curMarketWrapper = MarketWrapper(payable(_marketWrapper));
        curMarketWrapper.grantOwnerRole(_to);
    }

}
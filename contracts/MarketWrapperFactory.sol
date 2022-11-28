// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/AMarketWrapperFactory.sol";


contract MarketWrapperFactory is AMarketWrapperFactory{

    address[] marketWrappers;
    uint256 count = 0;

    constructor()
    AMarketWrapperFactory()
    {}

    function newMarketWrapper (uint256 _buyNowPrice, address _marketPlace, string memory _ethTransactionData) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)returns (address) 
    {
        MarketWrapper newWrapper = new MarketWrapper(_buyNowPrice, _marketPlace, _ethTransactionData);
        marketWrappers.push(address(newWrapper));
        count+=1;
        return address(newWrapper);
    }

    function giveContractOwnership(address _marketWrapper, address _to) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)
    {   
        MarketWrapper curMarketWrapper = MarketWrapper(payable(_marketWrapper));
        curMarketWrapper.grantOwnerRole(_to);
    }

    function getLatestMarketWrapper() view override external returns (address) {
        return marketWrappers[count-1];
    }

}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/ACrowdsaleFactory.sol";


abstract contract MoonTokenFactory is ACrowdsaleFactory{

    address[] moonSales;
    mapping(address => address) saleTokens;
    mapping(address => address) saleVaults;
    mapping(address => address) saleMarketWrappers;

    ITokenFactory tokenFactory;
    IMarketWrapperFactory marketWrapperFactory;
    IVaultFactory vaultFactory;

    constructor(address _tokenFactory, address _marketWrapperFactory, address _vaultFactory)
    ACrowdsaleFactory()
    {
        tokenFactory = ITokenFactory(_tokenFactory);
        marketWrapperFactory = IMarketWrapperFactory(_marketWrapperFactory);
        vaultFactory = IVaultFactory(_vaultFactory);
    }

    function newMoonSale(
        uint256 _rate,
        address _token,
        uint256 _openingTime,
        uint256 _closingTime,
        string memory _name, 
        string memory _symbol, 
        uint256 _baseNftID)
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address){
        address vaultAddress = vaultFactory.newMoonVault();
        address marketWrapperAddress = marketWrapperFactory.newMarketWrapper();
        address tokenAddress = tokenFactory.newMoonToken(_name, _symbol, _baseNftID);

        vaultFactory.giveContractOwnership(vaultAddress, address(this));
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, address(this));
        tokenFactory.giveContractOwnership(tokenAddress, address(this));

        MoonSale moonSale = new MoonSale(
                                        _rate,
                                        _token,
                                        _openingTime,
                                        _closingTime, 
                                        payable(vaultAddress),
                                        payable(marketWrapperAddress));

        address saleAddress = address(moonSale);

        vaultFactory.giveContractOwnership(vaultAddress, saleAddress);
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, saleAddress);
        tokenFactory.giveContractOwnership(tokenAddress, saleAddress);
        
        moonSales.push(saleAddress);
        saleTokens[saleAddress] = tokenAddress;
        saleVaults[saleAddress] = vaultAddress;
        saleMarketWrappers[saleAddress] = marketWrapperAddress;

        return saleAddress;
    }


    function migration(
        address _sale, 
        uint256 _newClosingTime,
        uint256 _baseNftID) 
    override external onlyRole(DEFAULT_ADMIN_ROLE) {
        
        IToken token = IToken(saleTokens[_sale]);
        token.migration(_baseNftID);

        address marketWrapperAddress = marketWrapperFactory.newMarketWrapper();
        MoonSale moonSale = MoonSale(payable(_sale));
        moonSale.migration(_newClosingTime, marketWrapperAddress);

        saleMarketWrappers[_sale] = marketWrapperAddress;
    }

    function emergencyWithdrawal(address _sale, address payable _to) 
    payable override external onlyRole(DEFAULT_ADMIN_ROLE){

        IMarketWrapper wrapper = IMarketWrapper(payable(saleMarketWrappers[_sale]));
        IVault vault = IVault(payable(saleVaults[_sale]));
        ICrowdsale sale = ICrowdsale(payable(_sale));

        wrapper.emergencyWithdrawal(_to);
        vault.emergencyWithdrawal(_to);
        sale.emergencyWithdrawal(_to);
    }


}
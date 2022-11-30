// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./abstracts/factories/ACrowdsaleFactory.sol";

contract MoonSaleFactory is ACrowdsaleFactory{

    address[] public moonSales;
    uint256 public count = 0;
    mapping(address => address) public saleTokens;
    mapping(address => address) public saleVaults;
    mapping(address => address) public saleMarketWrappers;

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
        uint256 _openingTime,
        uint256 _closingTime,
        string memory _name, 
        string memory _symbol, 
        uint256 _baseNftID,
        uint256 _buyNowPrice,
        address _marketPlace,
        BasicOrderParameters memory _transactionData)
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address){
 
        address vaultAddress =  vaultFactory.newMoonVault();
        address marketWrapperAddress = marketWrapperFactory.newMarketWrapper(_buyNowPrice, _marketPlace, _transactionData);
        address tokenAddress =  tokenFactory.newMoonToken(_name, _symbol, _baseNftID);

        vaultFactory.giveContractOwnership(vaultAddress, address(this));
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, address(this));
        tokenFactory.giveContractOwnership(tokenAddress, address(this));

        vaultFactory.giveContractOwnership(vaultAddress, msg.sender);
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, msg.sender);
        tokenFactory.giveContractOwnership(tokenAddress, msg.sender);

        MoonSale moonSale = new MoonSale(
                                        _rate,
                                        tokenAddress,
                                        _openingTime,
                                        _closingTime, 
                                        payable(vaultAddress),
                                        payable(marketWrapperAddress));

        address saleAddress = address(moonSale);

        vaultFactory.giveContractOwnership(vaultAddress, saleAddress);
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, saleAddress);
        tokenFactory.giveContractOwnership(tokenAddress, saleAddress);

        moonSale.grantOwnerRole(address(this));
        moonSale.grantOwnerRole(msg.sender);

        moonSales.push(saleAddress);
        count +=1 ;

        saleTokens[saleAddress] = tokenAddress;
        saleVaults[saleAddress] = vaultAddress;
        saleMarketWrappers[saleAddress] = marketWrapperAddress;

        return saleAddress;

    }


    function migration(
        address _sale, 
        uint256 _newClosingTime,
        uint256 _baseNftID,
        uint256 _buyNowPrice,
        address _marketPlace,
        BasicOrderParameters memory _transactionData) 
    override external onlyRole(DEFAULT_ADMIN_ROLE) {
        
        IToken token = IToken(saleTokens[_sale]);
        token.migration(_baseNftID);

        marketWrapperFactory.newMarketWrapper(_buyNowPrice, _marketPlace, _transactionData);

        address marketWrapperAddress = marketWrapperFactory.getLatestMarketWrapper();
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, address(this));
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, msg.sender);
        marketWrapperFactory.giveContractOwnership(marketWrapperAddress, _sale);

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

    function changeMarketWrapperFactory(address payable _newFactory) 
    external onlyRole(DEFAULT_ADMIN_ROLE){
        marketWrapperFactory = IMarketWrapperFactory(_newFactory);
    }

    function changeVaultFactory(address payable _newFactory) 
    external onlyRole(DEFAULT_ADMIN_ROLE){
        vaultFactory = IVaultFactory(_newFactory);
        
    }

    function changeTokenFactory(address payable _newFactory) 
    external onlyRole(DEFAULT_ADMIN_ROLE){
        tokenFactory = ITokenFactory(_newFactory);
    }


    function getLatestSale() view override external returns (address){
        return moonSales[count-1];
    }

}
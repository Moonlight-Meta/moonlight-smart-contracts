// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./abstracts/factories/ACrowdsaleFactory.sol";

contract MoonSaleFactory is ACrowdsaleFactory {
    struct MSale {
        address saleAddress;
        address collectionAddress;
        uint256 tokenId;
    }
    MSale[] public moonSales;
    function numSales() public view returns(uint count) {
        return moonSales.length;
    }
    mapping(address => address) public saleTokens;
    mapping(address => address) public saleVaults;
    mapping(address => address) public saleMarketWrappers;
    IMarketWrapperFactory marketWrapperFactory;
    IVaultFactory vaultFactory;
    constructor(
        address _marketWrapperFactory,
        address _vaultFactory
    ) ACrowdsaleFactory() {
        marketWrapperFactory = IMarketWrapperFactory(_marketWrapperFactory);
        vaultFactory = IVaultFactory(_vaultFactory);
    }
    function newMoonSale(
        uint256 _rate,
        uint256 _closingTime,
        MarketWrapperConstructorParameters calldata _params
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        address vaultAddress = vaultFactory.newMoonVault();
        address marketWrapperAddress = marketWrapperFactory.newMarketWrapper(_params);

        vaultFactory.giveContractOwnership(
            vaultAddress, 
            address(this)
        );
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            address(this)
        );

        vaultFactory.giveContractOwnership(
            vaultAddress,
            msg.sender
            );
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            msg.sender
        );

        address saleAddress = _newMoonSale(
            _rate,
            _params.orderParams.offerToken,
            block.timestamp,
            _closingTime,
            payable(vaultAddress),
            payable(marketWrapperAddress),
            _params.buyNowPrice
        );

        vaultFactory.giveContractOwnership(
            vaultAddress, 
            saleAddress
        );
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            saleAddress
        );
        IToken token = IToken(_params.orderParams.offerToken);
        token.grantOwnerRole(saleAddress);

        MoonSale moonSale = MoonSale(payable(saleAddress));
        moonSale.grantOwnerRole(address(this));
        moonSale.grantOwnerRole(msg.sender);

        moonSales.push(MSale(saleAddress, _params.orderParams.offerToken, _params.orderParams.offerIdentifier));

        saleTokens[saleAddress] = _params.orderParams.offerToken;
        saleVaults[saleAddress] = vaultAddress;
        saleMarketWrappers[saleAddress] = marketWrapperAddress;

        return saleAddress;
    }

    function _newMoonSale(
        uint256 _rate,
        address _tokenAddress,
        uint256 _openingTime,
        uint256 _closingTime,
        address payable _vault,
        address payable _wrapper,
        uint256 _buyNowPrice
    ) internal returns (address) {
        MoonSale moonSale = new MoonSale(
            _rate,
            _tokenAddress,
            _openingTime,
            _closingTime,
            _vault,
            _wrapper,
            _buyNowPrice
        );

        return address(moonSale);
    }
    function migration(
        uint256 _newClosingTime,
        string memory _fractionalUri,
        address _sale,
        MarketWrapperConstructorParameters calldata _params
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        address _foundSale = address(0);
        for (uint i = 0; i < moonSales.length; i++) {
            if (_sale == moonSales[i].saleAddress) {
                _foundSale = _sale;
                moonSales[i].tokenId =_params.orderParams.offerIdentifier;
            }
        }
        require(_foundSale != address(0), 'That Sale Does not Exist');
        address iTokenAdd = saleTokens[_sale];
        IToken token = IToken(iTokenAdd);
        token.migration(_params.orderParams.offerIdentifier, _fractionalUri);
        IMarketWrapper wrapper = IMarketWrapper(
            payable(saleMarketWrappers[_sale])
        );
        wrapper.migration(_params);
        MoonSale moonSale = MoonSale(payable(_sale));
        moonSale.migration(_newClosingTime, _params.buyNowPrice);
    }
}

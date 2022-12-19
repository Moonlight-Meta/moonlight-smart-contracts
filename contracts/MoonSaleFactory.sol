// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./abstracts/factories/ACrowdsaleFactory.sol";
import "./main/OrderStructs.sol";
contract MoonSaleFactory is ACrowdsaleFactory {
    MSale[] public moonSales;
    uint public count;
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
        address _tokenAddress,
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
            _tokenAddress,
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
        IToken(_tokenAddress).grantOwnerRole(saleAddress);
        MoonSale(payable(saleAddress)).grantOwnerRole(address(this));
        MoonSale(payable(saleAddress)).grantOwnerRole(msg.sender);
        moonSales.push(MSale({
            saleAddress: saleAddress,
            collectionAddress: _params.orderParams.offerToken,
            tokenId: _params.orderParams.offerIdentifier
        }));
        count = count + 1;
        saleTokens[saleAddress] = _tokenAddress;
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
        bool _foundSale = false;
        for (uint i = 0; i < moonSales.length; i++) {
            if (_sale == moonSales[i].saleAddress) {
                _foundSale = true;
                moonSales[i].tokenId =_params.orderParams.offerIdentifier;
            }
        }
        require(_foundSale == true);
        IToken(saleTokens[_sale]).migration(_params.orderParams.offerIdentifier, _fractionalUri);
        IMarketWrapper(
            payable(saleMarketWrappers[_sale])
        ).migration(_params);
        MoonSale(payable(_sale)).migration(_newClosingTime, _params.buyNowPrice);
    }
}

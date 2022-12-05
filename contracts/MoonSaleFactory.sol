// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./abstracts/factories/ACrowdsaleFactory.sol";

contract MoonSaleFactory is ACrowdsaleFactory {
    address[] public moonSales;
    uint256 public count = 0;
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
        address _tokenAddress,
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _buyNowPrice,
        uint256 gasEstimate,
        address _marketPlace,
        bytes memory _transactionData
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        address vaultAddress = vaultFactory.newMoonVault();
        address marketWrapperAddress = marketWrapperFactory.newMarketWrapper(
            _buyNowPrice,
            gasEstimate,
            _marketPlace,
            _transactionData
        );

        vaultFactory.giveContractOwnership(vaultAddress, address(this));
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            address(this)
        );

        vaultFactory.giveContractOwnership(vaultAddress, msg.sender);
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            msg.sender
        );

        address saleAddress = _newMoonSale(
            _rate,
            _tokenAddress,
            _openingTime,
            _closingTime,
            payable(vaultAddress),
            payable(marketWrapperAddress)
        );

        vaultFactory.giveContractOwnership(vaultAddress, saleAddress);
        marketWrapperFactory.giveContractOwnership(
            marketWrapperAddress,
            saleAddress
        );
        IToken token = IToken(_tokenAddress);
        token.grantOwnerRole(saleAddress);

        MoonSale moonSale = MoonSale(payable(saleAddress));
        moonSale.grantOwnerRole(address(this));
        moonSale.grantOwnerRole(msg.sender);

        moonSales.push(saleAddress);
        count += 1;

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
        address payable _wrapper
    ) internal returns (address) {
        MoonSale moonSale = new MoonSale(
            _rate,
            _tokenAddress,
            _openingTime,
            _closingTime,
            _vault,
            _wrapper
        );

        return address(moonSale);
    }

    function migration(
        address _sale,
        uint256 _newClosingTime,
        uint256 _tokenId,
        string memory _fractionalUri,
        uint256 _price,
        uint256 _gasEstimate,
        address _marketPlace,
        bytes memory _transactionData
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        IToken token = IToken(saleTokens[_sale]);
        token.migration(_tokenId, _fractionalUri);

        IMarketWrapper wrapper = IMarketWrapper(
            payable(saleMarketWrappers[_sale])
        );
        wrapper.migration(_price, _gasEstimate, _marketPlace, _transactionData);

        MoonSale moonSale = MoonSale(payable(_sale));
        moonSale.migration(_newClosingTime);
    }

    function emergencyWithdrawal(
        address _sale,
        address payable _to
    ) external payable override onlyRole(DEFAULT_ADMIN_ROLE) {
        IMarketWrapper wrapper = IMarketWrapper(
            payable(saleMarketWrappers[_sale])
        );
        IVault vault = IVault(payable(saleVaults[_sale]));
        ICrowdsale sale = ICrowdsale(payable(_sale));

        wrapper.emergencyWithdrawal(_to);
        vault.emergencyWithdrawal(_to);
        sale.emergencyWithdrawal(_to);
    }

    function changeMarketWrapperFactory(
        address payable _newFactory
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        marketWrapperFactory = IMarketWrapperFactory(_newFactory);
    }

    function changeVaultFactory(
        address payable _newFactory
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        vaultFactory = IVaultFactory(_newFactory);
    }

    function getLatestSale() external view override returns (address) {
        return moonSales[count - 1];
    }
}

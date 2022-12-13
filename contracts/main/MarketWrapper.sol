// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper {
    uint256 public buyNowPrice;
    address public marketPlace;
    bytes public transactionData;

    event Purchased(bool success);

    constructor(
        uint256 _buyNowPrice,
        address _marketPlace,
        bytes memory _transactionData
    ) AMarketWrapper() {
        buyNowPrice = _buyNowPrice;
        marketPlace = _marketPlace;
        transactionData = _transactionData;
    }

    function getBuyNowPrice() external view override returns (uint256) {
        return buyNowPrice;
    }

    function setBuyNowPrice(
        uint256 _price
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        buyNowPrice = _price;
    }

    function setTransactionData(
        bytes memory _transactionData
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transactionData = _transactionData;
    }

    function migration(
        uint256 _price,
        address _marketPlace,
        bytes memory _transactionData
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        buyNowPrice = _price;
        marketPlace = _marketPlace;
        transactionData = _transactionData;
    }

    function buyNow()
        external
        payable
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (bool)
    {
        require(address(this).balance >= buyNowPrice);

        (bool success, ) = marketPlace.call{
            value: buyNowPrice
        }(transactionData);
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }

    function withdrawNft(
        address _nftContractAddress,
        uint256 _tokenId,
        address _to
    ) public onlyRole(DEFAULT_ADMIN_ROLE){
        require(ERC721(address(_nftContractAddress)).ownerOf(_tokenId) == address(this), "Contract does not own the NFT");
        
        ERC721(address(_nftContractAddress)).transferFrom(address(this), _to, _tokenId);
    }
}

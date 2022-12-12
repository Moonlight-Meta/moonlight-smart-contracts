// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICrowdsaleFactory {
    
    struct SaleIndex {
        address nftContractAddress;
        uint256 tokenId;
    }

    function grantOwnerRole(address to) external;

    function newMoonSale(
        SaleIndex memory _saleIndex,
        uint256 _rate,
        address _tokenAddress,
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _buyNowPrice,
        address _marketPlace,
        bytes memory _transactionData
    ) external returns (address);

    function migration(
        address _sale,
        uint256 _newClosingTime,
        uint256 _tokenId,
        string memory _fractionalUri,
        uint256 _price,
        address _marketPlace,
        bytes memory _transactionData
    ) external;

    function emergencyWithdrawal(
        address _sale,
        address payable _to
    ) external payable;

}

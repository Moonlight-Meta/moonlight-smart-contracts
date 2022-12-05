// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IMarketWrapper {
    receive() external payable;

    fallback() external payable;

    function grantOwnerRole(address _to) external;

    function getBuyNowPrice() external returns (uint256);

    function emergencyWithdrawal(address payable _to) external payable;

    function migration(
        uint256 _price,
        uint256 _gasEstimate,
        address _marketPlace,
        bytes memory _transactionData
    ) external;

    function buyNow() external payable returns (bool);
}

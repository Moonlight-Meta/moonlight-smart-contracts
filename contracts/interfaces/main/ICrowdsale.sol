// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICrowdsale {
    receive() external payable;

    fallback() external payable;

    function grantOwnerRole(address _to) external;

    function emergencyWithdrawal(address payable _to) external payable;

    function buyTokens(address _beneficiary, bool _refundable) external payable;

    function migration(uint256 _newClosingTime, uint256 buyNowPrice) external;

    function collectTokens() external;

    function refund() external payable;
}

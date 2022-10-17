// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface ICrowdsale{

    receive() external payable;

    fallback() external payable;

    function grantOwnerRole (address to) external;

    function emergencyWithdrawal(address payable to) external payable;

    function buyTokens(address _beneficiary, bool _refundable) payable external;

    function migration(uint256 _newClosingTime, address _marketWrapper) external;

    function collectTokens() external;

    function refund() external payable;

}

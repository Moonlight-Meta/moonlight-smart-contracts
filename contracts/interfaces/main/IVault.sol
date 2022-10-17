// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVault{

    receive() external payable;

    fallback() external payable;

    function grantOwnerRole (address to) external;

    function close() external;

    function updateRefundableBalances(address investor, uint256 weiAmount) external;

    function deductRefundableBalances(address investor, uint256 weiAmount) external;

    function refund(address payable investor) external;

    function emergencyWithdrawal(address payable to) external payable;

}
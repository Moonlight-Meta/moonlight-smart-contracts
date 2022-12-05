// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVault {
    receive() external payable;

    fallback() external payable;

    function grantOwnerRole(address _to) external;

    function close() external;

    function updateRefundableBalances(
        address _investor,
        uint256 _weiAmount
    ) external;

    function deductRefundableBalances(
        address _investor,
        uint256 _weiAmount
    ) external;

    function refund(address payable _investor) external;

    function emergencyWithdrawal(address payable _to) external payable;
}

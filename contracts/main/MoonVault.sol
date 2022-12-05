// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AVault.sol";

contract MoonVault is AVault {
    enum State {
        Active,
        Closed
    }
    State public state;
    modifier ifActive() {
        require(state == State.Active);
        _;
    }

    mapping(address => uint256) public refundableBalances;

    constructor() AVault() {
        state = State.Active;
    }

    function close() external override onlyRole(DEFAULT_ADMIN_ROLE) ifActive {
        state = State.Closed;
        emit Closed();
    }

    function updateRefundableBalances(
        address investor,
        uint256 weiAmount
    ) external override ifActive onlyRole(DEFAULT_ADMIN_ROLE) {
        refundableBalances[investor] += weiAmount;
    }

    function deductRefundableBalances(
        address investor,
        uint256 weiAmount
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(refundableBalances[investor] >= 0);
        if (refundableBalances[investor] >= weiAmount) {
            refundableBalances[investor] -= weiAmount;
        }
    }

    function refund(
        address payable investor
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(refundableBalances[investor] > 0);
        uint256 depositedValue = refundableBalances[investor];
        refundableBalances[investor] = 0;

        (bool success, ) = investor.call{value: depositedValue}("");
        require(success, "Ether transfer failed.");

        emit Refunded(investor, depositedValue);
    }
}

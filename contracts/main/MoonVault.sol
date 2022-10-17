// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AVault.sol";

contract MoonVault is AVault{

    enum State {Active, Closed}
    State public state;
    modifier ifActive{require(state == State.Active); _;}

    mapping (address => uint256) public refundableBalances;

    constructor()
    AVault(){
        state = State.Active;
    }

    function close() 
    onlyRole(DEFAULT_ADMIN_ROLE) ifActive override external 
    {
        state = State.Closed;
        emit Closed();
    }

    function updateRefundableBalances(address investor, uint256 weiAmount) 
    ifActive onlyRole(DEFAULT_ADMIN_ROLE) override external
    {
        refundableBalances[investor] += weiAmount;
    }

    function deductRefundableBalances(address investor, uint256 weiAmount)
    onlyRole(DEFAULT_ADMIN_ROLE) override external
    {
        refundableBalances[investor] -= weiAmount;
    }

    function refund(address payable investor)
    onlyRole(DEFAULT_ADMIN_ROLE) override external 
    {
        require(refundableBalances[investor] > 0);
        uint256 depositedValue = refundableBalances[investor];
        refundableBalances[investor] = 0;
        
        (bool success,) = investor.call{value: depositedValue}("");
        require(success, "Ether transfer failed.");

        emit Refunded(investor, depositedValue);
    }

}
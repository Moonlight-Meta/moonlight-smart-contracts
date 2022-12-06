// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "../../interfaces/main/IVault.sol";

abstract contract AVault is IVault, AccessControl{
    using SafeMath for uint256;

    event Closed();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable onlyRole(DEFAULT_ADMIN_ROLE){}

    fallback() external payable onlyRole(DEFAULT_ADMIN_ROLE){}

    function grantOwnerRole (address to)
    public onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function emergencyWithdrawal (address payable to)
    external payable onlyRole(DEFAULT_ADMIN_ROLE)
    {
        (bool success,) = to.call{value: address(this).balance}("");
        require(success, "Ether transfer failed.");
    }


}
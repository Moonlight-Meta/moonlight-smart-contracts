// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../../interfaces/main/IMarketWrapper.sol";

abstract contract AMarketWrapper is IMarketWrapper, AccessControl{
     using SafeMath for uint256;

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable{}

    fallback() external payable{}

    function grantOwnerRole (address to) 
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    
    function emergencyWithdrawal (address payable to)
    external payable onlyRole(DEFAULT_ADMIN_ROLE)
    {
        (bool success,) = to.call{value: address(this).balance}("");
        require(success, "Ether transfer failed.");
    }

    function getBuyNowPrice()
    virtual external returns (uint256);

    function setBuyNowPrice(uint256 price) virtual external;

    function buyNow()
    virtual external payable returns (bool);

}
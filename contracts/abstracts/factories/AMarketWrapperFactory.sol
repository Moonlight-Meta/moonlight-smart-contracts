// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


import "../../interfaces/factories/IMarketWrapperFactory.sol";
import "../../main/MarketWrapper.sol";


abstract contract AMarketWrapperFactory is IMarketWrapperFactory, AccessControl{
    using SafeMath for uint256;

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantOwnerRole (address to) 
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function newMarketWrapper(uint256 buyNowPrice, address marketPlace, bytes memory transactionData, uint256 gasEstimate) 
    virtual external returns (address);

    function giveContractOwnership(address marketWrapper, address to) 
    virtual external;

    function getLatestMarketWrapper() virtual external returns (address);

    
}
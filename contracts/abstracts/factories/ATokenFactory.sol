// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


import "../../interfaces/factories/ITokenFactory.sol";
import "../../main/MoonToken.sol";


abstract contract ATokenFactory is ITokenFactory, AccessControl{
    using SafeMath for uint256;

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantOwnerRole (address to) 
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function newMoonToken (string memory _name, string memory _symbol, uint256 _baseNftID, string memory nftURI)
    virtual external returns (address);

    function giveContractOwnership(address token, address to) 
    virtual external;

    function getLatestToken() virtual external returns (address);
    
}
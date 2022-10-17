// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


import "../../interfaces/factories/IVaultFactory.sol";
import "../../main/MoonVault.sol";


abstract contract AVaultFactory is IVaultFactory, AccessControl{
    using SafeMath for uint256;

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantOwnerRole (address to) 
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function newMoonVault ()
    virtual external returns (address);

    function giveContractOwnership(address vault, address to) 
    virtual external;

}
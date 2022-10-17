// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/AVaultFactory.sol";


abstract contract MoonVaultFactory is AVaultFactory{

    address[] moonVaults;

    constructor()
    AVaultFactory()
    {}

    function newMoonVault ()
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) 
    {
        MoonVault newVault = new MoonVault();
        moonVaults.push(address(newVault));
        return address(newVault);
    }

    function giveContractOwnership(address _vault, address _to) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)
    {   
        MoonVault curVault = MoonVault(payable(_vault));
        curVault.grantOwnerRole(_to);
    }


}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/AVaultFactory.sol";


contract MoonVaultFactory is AVaultFactory{

    uint256 count = 0;
    address[] moonVaults;

    constructor()
    AVaultFactory()
    {}

    function newMoonVault ()
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address)
    {
        MoonVault newVault = new MoonVault();
        moonVaults.push(address(newVault));
        count +=1;
        return address(newVault);
    }

    function giveContractOwnership(address _vault, address _to) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)
    {   
        MoonVault curVault = MoonVault(payable(_vault));
        curVault.grantOwnerRole(_to);
    }

    function getLatestVault() view override  external returns (address) {
        return moonVaults[count-1];
    }


}
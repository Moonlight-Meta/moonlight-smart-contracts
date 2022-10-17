// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "./abstracts/factories/ATokenFactory.sol";


abstract contract MoonTokenFactory is ATokenFactory{

    address[] moonTokens;

    constructor()
    ATokenFactory()
    {}

    function newMoonToken (string memory _name, string memory _symbol, uint256 _baseNftID)
    override external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) 
    {
        MoonToken newToken = new MoonToken(_name,_symbol,_baseNftID);
        moonTokens.push(address(newToken));
        return address(newToken);
    }

    function giveContractOwnership(address _token, address _to) 
    override external onlyRole(DEFAULT_ADMIN_ROLE)
    {   
        MoonToken curToken = MoonToken(_token);
        curToken.grantOwnerRole(_to);
        curToken.grantMinterRole(_to);
    }

}
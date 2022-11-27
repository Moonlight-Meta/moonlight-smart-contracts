// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AToken.sol";

contract MoonToken is AToken{
    uint256 public baseNftID;
    string nftName;
    string nftSymbol;

    constructor(string memory _name, string memory _symbol, uint256 _baseNftID, string memory _tokenBaseURI)
    AToken(_tokenBaseURI)
    {
        nftName = _name;
        nftSymbol = _symbol;
        baseNftID = _baseNftID;
    }

    function mint(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE)returns (uint256) {
        _mint(to, baseNftID, amount, "");
        return baseNftID;
    }

    function migration(uint256 _baseNftID)
    onlyRole(DEFAULT_ADMIN_ROLE) public override 
    {
        baseNftID = _baseNftID;
    }   

}
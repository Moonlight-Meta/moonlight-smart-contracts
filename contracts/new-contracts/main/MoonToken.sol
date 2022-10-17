// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AToken.sol";

contract MoonToken is AToken{

    uint256 public baseNftID;

    constructor(string memory _name, string memory _symbol, uint256 _baseNftID)
    AToken(_name, _symbol)
    {
        baseNftID = _baseNftID;
    }

    function mint(address to, uint256 quantity)
    onlyRole(MINTER_ROLE) public override 
    {
        _safeMint(to, quantity);
    }

    function migration(uint256 _baseNftID)
    onlyRole(DEFAULT_ADMIN_ROLE) public override 
    {
        baseNftID = _baseNftID;
    }   

}
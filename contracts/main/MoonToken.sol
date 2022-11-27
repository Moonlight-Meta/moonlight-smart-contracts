// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AToken.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MoonToken is AToken{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public baseNftID;

    constructor(string memory _name, string memory _symbol, uint256 _baseNftID)
    AToken(_name, _symbol)
    {
        baseNftID = _baseNftID;
    }

    // string memory tokenURI
    function mint(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE)returns (uint256[] memory) {
        uint256[] memory result = new uint256[](uint(amount));
        for (uint i = 0; uint256(i) < amount; i++) {
            uint256 newItemId = baseNftID + _tokenIds.current();
            _mint(to, newItemId);
            // _setTokenURI(newItemId, tokenURI);
            result[i] = newItemId;
        }
        return result;
    }

    function migration(uint256 _baseNftID)
    onlyRole(DEFAULT_ADMIN_ROLE) public override 
    {
        baseNftID = _baseNftID;
    }   

}
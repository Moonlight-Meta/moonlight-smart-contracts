// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "erc721psi/contracts/ERC721Psi.sol";

import "../../interfaces/main/IToken.sol";

abstract contract AToken is IToken, ERC721Psi, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory _name, string memory _symbol)
    ERC721Psi(_name,_symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function grantMinterRole(address to)
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(MINTER_ROLE, to);
    }

    function grantOwnerRole (address to) 
    external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function supportsInterface(bytes4 interfaceId) 
    public view override(ERC721Psi, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
      
    function mint(address to, uint256 quantity) 
    external virtual;
    
    function migration(uint256 newBaseNftId) 
    external virtual;

}
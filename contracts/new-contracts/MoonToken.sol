// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "erc721psi/contracts/ERC721Psi.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MoonToken is ERC721Psi, AccessControl {
    using SafeMath for uint256;

    uint256 public baseNftId;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name_, string memory symbol_, uint256 baseNftId_)
    ERC721Psi(name_, symbol_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        baseNftId = baseNftId_;
    }

    function mint(address to, uint256 quantity) public onlyRole(MINTER_ROLE) {
       // _safeMint's second argument now takes in a quantity, not a tokenId. (same as ERC721A)
        _safeMint(to, quantity);
    }

    function grantMintability(address to) public onlyRole(DEFAULT_ADMIN_ROLE){
        _grantRole(MINTER_ROLE, to);
    }

    function migration(uint256 newBaseNftId) public onlyRole(DEFAULT_ADMIN_ROLE){
        baseNftId = newBaseNftId;
    }   

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Psi, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

}
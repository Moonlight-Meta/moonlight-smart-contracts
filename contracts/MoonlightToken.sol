// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MoonlightToken is ERC20, AccessControl {
    using SafeMath for uint256;

    string private _name;
    string private _symbol;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name_, string memory symbol_)
    ERC20(name_, symbol_)
    {
        _name = name_;
        _symbol = symbol_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function grantMintability(address to) public onlyRole(DEFAULT_ADMIN_ROLE){
        _grantRole(MINTER_ROLE, to);
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function migration(string memory name_, string memory symbol_) public onlyRole(DEFAULT_ADMIN_ROLE){
        _name = name_;
        _symbol = symbol_;
    }   

}
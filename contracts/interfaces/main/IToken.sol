// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IToken{

    function mint(address to, uint256 quantity) external ;

    function grantOwnerRole (address to) external;

    function migration(uint256 newBaseNftId) external;

}
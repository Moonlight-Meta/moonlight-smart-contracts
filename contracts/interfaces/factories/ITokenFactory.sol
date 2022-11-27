// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface ITokenFactory{

    function grantOwnerRole(address to) external;

    function giveContractOwnership(address token, address to) external;

    function newMoonToken (string memory _name, string memory _symbol, uint256 _baseNftID, string memory nftURI) external returns (address);

    function getLatestToken() external returns (address);
}
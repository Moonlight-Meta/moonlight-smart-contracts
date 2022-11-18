// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface IVaultFactory{

    function grantOwnerRole(address to) external;

    function giveContractOwnership(address vault, address to) external;

    function newMoonVault() external returns (address);

    function getLatestVault() external returns (address);
}

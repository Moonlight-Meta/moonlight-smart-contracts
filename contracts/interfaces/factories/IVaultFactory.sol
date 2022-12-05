// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVaultFactory {
    function grantOwnerRole(address _to) external;

    function giveContractOwnership(address _vault, address to) external;

    function newMoonVault() external returns (address);

    function getLatestVault() external returns (address);
}

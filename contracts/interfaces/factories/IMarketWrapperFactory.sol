// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface IMarketWrapperFactory{

    function grantOwnerRole(address to) external;

    function giveContractOwnership(address marketWrapper, address to) external;

    function newMarketWrapper(uint256 buyNowPrice) external returns (address);

    function getLatestMarketWrapper() external returns (address);

}

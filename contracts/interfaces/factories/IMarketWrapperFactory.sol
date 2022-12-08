// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IMarketWrapperFactory {
    function grantOwnerRole(address _to) external;

    function giveContractOwnership(
        address _marketWrapper,
        address _to
    ) external;

    function newMarketWrapper(
        uint256 _buyNowPrice,
        address _marketPlace,
        bytes memory _transactionData
    ) external returns (address);

    function getLatestMarketWrapper() external returns (address);
}

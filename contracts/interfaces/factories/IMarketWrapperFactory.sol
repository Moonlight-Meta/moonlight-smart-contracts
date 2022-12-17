// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../../main/OrderStructs.sol";

interface IMarketWrapperFactory {
    function grantOwnerRole(address _to) external;

    function giveContractOwnership(
        address _marketWrapper,
        address _to
    ) external;

    function newMarketWrapper(MarketWrapperConstructorParameters calldata params_) external returns (address);

    function getLatestMarketWrapper() external returns (address);
}

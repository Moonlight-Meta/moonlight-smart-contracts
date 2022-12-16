// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../../main/OrderStructs.sol";

interface IMarketWrapperFactory {
    function grantOwnerRole(address _to) external;

    function giveContractOwnership(
        address _marketWrapper,
        address _to
    ) external;

    function newMarketWrapper(
        uint256 _buyNowPrice,
        address _marketPlace,
        BasicOrderParameters calldata orderParams_
    ) external returns (address);

    function getLatestMarketWrapper() external returns (address);
}

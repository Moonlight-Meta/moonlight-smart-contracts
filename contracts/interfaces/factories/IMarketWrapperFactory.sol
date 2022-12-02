// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {BasicOrderParameters} from "../../ConsiderationStructs.sol";

interface IMarketWrapperFactory{

    function grantOwnerRole(address to) external;

    function giveContractOwnership(address marketWrapper, address to) external;

    function newMarketWrapper(uint256 buyNowPrice, address marketPlace, bytes memory transactionData, uint256 gasEstimate) external returns (address);

    function getLatestMarketWrapper() external returns (address);

}

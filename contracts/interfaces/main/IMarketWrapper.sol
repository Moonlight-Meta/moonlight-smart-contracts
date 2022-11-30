// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {BasicOrderParameters} from "../../ConsiderationStructs.sol";

interface IMarketWrapper{

    receive() external payable;

    fallback() external payable;

    function grantOwnerRole (address to) external;

    function getBuyNowPrice() external returns (uint256);

    function setBuyNowPrice(uint256 price) external;

    function setMarketPlace(address marketPlace) external;

    function setTransactionData(BasicOrderParameters memory transactionData) external;

    function buyNow() external payable returns (bool);

    function emergencyWithdrawal(address payable to) external payable;

}
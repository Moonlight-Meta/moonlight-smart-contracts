// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {BasicOrderParameters} from "../../ConsiderationStructs.sol";

interface ICrowdsaleFactory{

    function grantOwnerRole(address to) external;

    function newMoonSale(
        uint256 _rate,
        uint256 _openingTime,
        uint256 _closingTime,
        string memory _name, 
        string memory _symbol, 
        uint256 _baseNftID,
        uint256 _buyNowPrice,
        address _marketPlace,
        bytes memory _transactionData,
        uint256 gasEstimate
    ) external returns (address);

    function migration(
        address moonSale, 
        uint256 _newClosingTime,
        uint256 _baseNftI,
        uint256 _buyNowPrice,
        address _marketPlace,
        bytes memory _transactionData,
        uint256 gasEstimate
        ) external;

    function emergencyWithdrawal(address sale, address payable to) payable external;

    function getLatestSale() external returns (address);
}

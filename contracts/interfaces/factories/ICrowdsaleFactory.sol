// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface ICrowdsaleFactory{

    function grantOwnerRole(address to) external;

    function newMoonSale(
        uint256 _rate,
        address _token,
        uint256 _openingTime,
        uint256 _closingTime,
        string memory _name, 
        string memory _symbol, 
        uint256 _baseNftID
    ) external returns (address);

    function migration(
        address moonSale, 
        uint256 _newClosingTime,
        uint256 _baseNftID
        ) external;

    function emergencyWithdrawal(address sale, address payable to) payable external;

}

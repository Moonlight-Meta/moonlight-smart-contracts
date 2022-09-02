// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTToken.sol";
import "./MoonlightCrowdsale.sol";

contract MoonlightFactory is Ownable{

    address payable[] moonlightCrowdsales;
    mapping(address => NFTToken) public crowdsaleToToken;

    constructor(){
    }

    function startMoonlightCrowdsale(
        uint256 _rate,
        address payable _wallet,
        string memory name,
        string memory symbol,
        uint256 _openingTime,
        uint256 _closingTime) public onlyOwner
    {
        NFTToken token = new NFTToken(name, symbol);
        MoonlightCrowdsale crowdsale = new MoonlightCrowdsale(_rate, _wallet, token, _openingTime, _closingTime);
        token.grantMintability(address(crowdsale));

        moonlightCrowdsales.push(payable(crowdsale));
        crowdsaleToToken[address(crowdsale)] = token;
    }

    function migration(
        address payable crowdsale,
        string memory name,
        string memory symbol,
        uint256 _openingTime,
        uint256 _closingTime
    ) public onlyOwner{
        NFTToken token = crowdsaleToToken[crowdsale];
        token.migration(name, symbol);
        MoonlightCrowdsale(crowdsale).migration(_openingTime, _closingTime);
    }

}

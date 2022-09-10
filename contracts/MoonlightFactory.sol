// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MoonlightNFT.sol";
import "./MoonlightCrowdsale.sol";

contract MoonlightFactory is Ownable{

    address payable[] moonlightCrowdsales;
    mapping(address => MoonlightNFT) public crowdsaleToToken;

    constructor(){
    }

    function startMoonlightCrowdsale(
        uint256 _rate,
        string memory name,
        string memory symbol,
        uint256 NFTbaseId,
        uint256 _openingTime,
        uint256 _closingTime) public onlyOwner
    {
        MoonlightNFT token = new MoonlightNFT(name, symbol, NFTbaseId);
        MoonlightCrowdsale crowdsale = new MoonlightCrowdsale(_rate, token, _openingTime, _closingTime);
        token.grantMintability(address(crowdsale));

        moonlightCrowdsales.push(payable(crowdsale));
        crowdsaleToToken[address(crowdsale)] = token;
    }

    function migration(
        address payable crowdsale,
        uint256 NFTbaseId,
        uint256 _openingTime,
        uint256 _closingTime
    ) public onlyOwner{
        MoonlightNFT token = crowdsaleToToken[crowdsale];
        token.migration(NFTbaseId);
        MoonlightCrowdsale(crowdsale).migration(_openingTime, _closingTime);
    }

}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTVault is Ownable {
    using SafeMath for uint256;

    enum State { Active, Closed}
    
    //individuals who deposited money and wanted a refund in the event of a migration
    mapping (address => uint256) public refundableBalances;
    
    //public wallet
    address payable public wallet;

    //state of crowdsale
    State public state;

    event Closed();
    event Migration();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    modifier ifActive{
        require(state == State.Active);
        _;
    }

    constructor(address payable _wallet){
        require(_wallet != address(0));
        wallet = _wallet;
        state = State.Active;
    }

    function deposit(address investor, bool refundable) ifActive onlyOwner public payable {
        if(refundable)
            refundableBalances[investor] = refundableBalances[investor].add(msg.value);
    }

    function close() onlyOwner ifActive public {
        state = State.Closed;
        emit Closed();
        wallet.transfer(address(this).balance);
    }

    function refund(address payable investor) public {
        require(refundableBalances[investor] > 0);
        uint256 depositedValue = refundableBalances[investor];
        refundableBalances[investor] = 0;
        investor.transfer(depositedValue);
        emit Refunded(investor, depositedValue);
    }

}
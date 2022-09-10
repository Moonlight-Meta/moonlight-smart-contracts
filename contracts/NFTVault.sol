// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTVault is Ownable {
    using SafeMath for uint256;

    enum State { Active, Closed}
    
    mapping (address => uint256) public refundableBalances;

    State public state;

    event Closed();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    modifier ifActive{
        require(state == State.Active);
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    constructor(){
        state = State.Active;
    }

    function updateRefundableBalances(address investor, uint256 weiAmount) ifActive onlyOwner external{
        refundableBalances[investor] = refundableBalances[investor].add(weiAmount);
    }

    function close() onlyOwner ifActive public {
        state = State.Closed;
        emit Closed();
    }

    function refund(address payable investor) ifActive onlyOwner external {
        require(refundableBalances[investor] > 0);
        uint256 depositedValue = refundableBalances[investor];
        refundableBalances[investor] = 0;
        investor.transfer(depositedValue);
        emit Refunded(investor, depositedValue);
    }

}
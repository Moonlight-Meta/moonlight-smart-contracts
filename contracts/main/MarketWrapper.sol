// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AMarketWrapper.sol";

contract MarketWrapper is AMarketWrapper {
    MarketWrapperConstructorParameters public params;
    event Purchased(bool success);

    constructor(
        MarketWrapperConstructorParameters memory _params
    ) AMarketWrapper() {
        params.buyNowPrice = _params.buyNowPrice;
        params.marketPlace = _params.marketPlace;
        params.orderParams.considerationToken = _params.orderParams.considerationToken;
        params.orderParams.considerationIdentifier = _params.orderParams.considerationIdentifier;
        params.orderParams.considerationAmount = _params.orderParams.considerationAmount;
        params.orderParams.offerer = _params.orderParams.offerer;
        params.orderParams.zone = _params.orderParams.zone;
        params.orderParams.offerToken = _params.orderParams.offerToken; 
        params.orderParams.offerIdentifier = _params.orderParams.offerIdentifier;
        params.orderParams.offerAmount = _params.orderParams.offerAmount;
        params.orderParams.basicOrderType = _params.orderParams.basicOrderType;
        params.orderParams.startTime = _params.orderParams.startTime;
        params.orderParams.endTime = _params.orderParams.endTime;
        params.orderParams.zoneHash = _params.orderParams.zoneHash;
        params.orderParams.salt = _params.orderParams.salt;
        params.orderParams.offererConduitKey = _params.orderParams.offererConduitKey;
        params.orderParams.fulfillerConduitKey = _params.orderParams.fulfillerConduitKey;
        params.orderParams.totalOriginalAdditionalRecipients = _params.orderParams.totalOriginalAdditionalRecipients;
        for (uint i = 0; i < _params.orderParams.additionalRecipients.length; i++) {
            uint256 curAmt = _params.orderParams.additionalRecipients[i].amount;
            address payable curRecipient = _params.orderParams.additionalRecipients[i].recipient;
            params.orderParams.additionalRecipients.push(AdditionalRecipient(curAmt, curRecipient));
        }
        params.orderParams.signature = _params.orderParams.signature;
    }

    function migration(
        MarketWrapperConstructorParameters calldata _params
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        params.buyNowPrice = _params.buyNowPrice;
        params.marketPlace = _params.marketPlace;
        params.orderParams.considerationToken = _params.orderParams.considerationToken;
        params.orderParams.considerationIdentifier = _params.orderParams.considerationIdentifier;
        params.orderParams.considerationAmount = _params.orderParams.considerationAmount;
        params.orderParams.offerer = _params.orderParams.offerer;
        params.orderParams.zone = _params.orderParams.zone;
        params.orderParams.offerToken = _params.orderParams.offerToken; 
        params.orderParams.offerIdentifier = _params.orderParams.offerIdentifier;
        params.orderParams.offerAmount = _params.orderParams.offerAmount;
        params.orderParams.basicOrderType = _params.orderParams.basicOrderType;
        params.orderParams.startTime = _params.orderParams.startTime;
        params.orderParams.endTime = _params.orderParams.endTime;
        params.orderParams.zoneHash = _params.orderParams.zoneHash;
        params.orderParams.salt = _params.orderParams.salt;
        params.orderParams.offererConduitKey = _params.orderParams.offererConduitKey;
        params.orderParams.fulfillerConduitKey = _params.orderParams.fulfillerConduitKey;
        params.orderParams.totalOriginalAdditionalRecipients = _params.orderParams.totalOriginalAdditionalRecipients;
        for (uint i = 0; i < _params.orderParams.additionalRecipients.length; i++) {
            uint256 curAmt = _params.orderParams.additionalRecipients[i].amount;
            address payable curRecipient = _params.orderParams.additionalRecipients[i].recipient;
            params.orderParams.additionalRecipients.push(AdditionalRecipient(curAmt, curRecipient));
        }
        params.orderParams.signature = _params.orderParams.signature;
    }

    function buyNow()
        external
        payable
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (bool)
    {
        require(address(this).balance >= params.buyNowPrice);

        (bool success, ) = params.marketPlace.call{
            value: params.buyNowPrice
        }(abi.encodeWithSignature(
            "fulfillBasicOrder((address,uint256,uint256,address,address,address,uint256,uint256,uint8,uint256,uint256,bytes32,uint256,bytes32,bytes32,uint256,(uint256,address)[],bytes))", params.orderParams)
        );
        require(success, "Purchase Failed");

        emit Purchased(true);
        return true;
    }

    function withdrawNft(
        address _nftContractAddress,
        uint256 _tokenId,
        address _to
    ) public onlyRole(DEFAULT_ADMIN_ROLE){
        require(ERC721(address(_nftContractAddress)).ownerOf(_tokenId) == address(this), "Contract does not own the NFT");
        
        ERC721(address(_nftContractAddress)).transferFrom(address(this), _to, _tokenId);
    }
}

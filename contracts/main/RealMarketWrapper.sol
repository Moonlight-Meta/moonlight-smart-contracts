// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;


// import "../abstracts/main/AMarketWrapper.sol";

//  enum BasicOrderType {
//         ETH_TO_ERC721_FULL_OPEN,
//         ETH_TO_ERC721_PARTIAL_OPEN,
//         ETH_TO_ERC721_FULL_RESTRICTED,
//         ETH_TO_ERC721_PARTIAL_RESTRICTED,
//         ETH_TO_ERC1155_FULL_OPEN,
//         ETH_TO_ERC1155_PARTIAL_OPEN,
//         ETH_TO_ERC1155_FULL_RESTRICTED,
//         ETH_TO_ERC1155_PARTIAL_RESTRICTED,
//         ERC20_TO_ERC721_FULL_OPEN,
//         ERC20_TO_ERC721_PARTIAL_OPEN,
//         ERC20_TO_ERC721_FULL_RESTRICTED,
//         ERC20_TO_ERC721_PARTIAL_RESTRICTED,
//         ERC20_TO_ERC1155_FULL_OPEN,
//         ERC20_TO_ERC1155_PARTIAL_OPEN,
//         ERC20_TO_ERC1155_FULL_RESTRICTED,
//         ERC20_TO_ERC1155_PARTIAL_RESTRICTED,
//         ERC721_TO_ERC20_FULL_OPEN,
//         ERC721_TO_ERC20_PARTIAL_OPEN,
//         ERC721_TO_ERC20_FULL_RESTRICTED,
//         ERC721_TO_ERC20_PARTIAL_RESTRICTED,
//         ERC1155_TO_ERC20_FULL_OPEN,
//         ERC1155_TO_ERC20_PARTIAL_OPEN,
//         ERC1155_TO_ERC20_FULL_RESTRICTED,
//         ERC1155_TO_ERC20_PARTIAL_RESTRICTED
//         }

//     struct AdditionalRecipient {
//         uint256 amount;
//         address payable recipient;
//         }

//     struct BasicOrderParameters {
//         address considerationToken;
//         uint256 considerationIdentifier;
//         uint256 considerationAmount;
//         address payable offerer;
//         address zone;
//         address offerToken;
//         uint256 offerIdentifier;
//         uint256 offerAmount;
//         BasicOrderType basicOrderType;
//         uint256 startTime;
//         uint256 endTime;
//         bytes32 zoneHash;
//         uint256 salt;
//         bytes32 offererConduitKey;
//         bytes32 fulfillerConduitKey;
//         uint256 totalOriginalAdditionalRecipients;
//         AdditionalRecipient[] additionalRecipients;
//         bytes signature;
//         }


// interface ISeaport{
//     function fulfillBasicOrder(BasicOrderParameters memory order) external payable returns (bool fulfilled);
// }

// contract MarketWrapper is AMarketWrapper{

//     uint256 buyNowPrice;
//     BasicOrderParameters offer;
//     ISeaport seaport;

//     constructor(
//         uint256 _buyNowPrice,
//         address payable _seaport,
//         BasicOrderParameters memory _offer
//                 )
//     AMarketWrapper(){
//         buyNowPrice = _buyNowPrice;
//         offer = _offer;
//         seaport = ISeaport(_seaport);
//     }

//     function getBuyNowPrice()
//     override view external returns (uint256){
//         return buyNowPrice;
//     }

//     function buyNow()
//     override external payable onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
//         bool success = seaport.fulfillBasicOrder(offer);
//         require(success == true, "transaction failed");
//         return success;
//     }

// }
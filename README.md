# How to deploy a MoonSale

# 1) The first step of deploying a MoonSale is to deploy the moonSale Factory

To do this we first need to deploy the VaultFactory and the MarketWrapper Factory, which take no parameters to deploy

Then, with the addresses of these two, we deploy the MoonSaleFactory with the parameters being the address of the former two factories.

# 2) The second step of deploying a MoonSale is to create a MoonToken for the sale

Doing this is slightly more complicated 

The MoonToken takes in four parameters

    1) The collection Owner address
    2) The admin token URI
    3) The fractional token URI
    4) The token Id

FIRST PARAMETER
The first parameter (collectionOwner) is simply the wallet address of the account you want to manage the collection on opensea (manage royalties, banner image, logo, social media links, etc.).  Most likely this address will be the address of the person deploying the token.

SECOND PARAMETER
The second paramter (adminUri) use the link below:
https://ipfs.io/ipfs/bafkreibujqgxnobxxhscvhi5vd532d43yxn3wfdznqdd7s4tbnwpd7rimy

THIRD PARAMETER
The third paramter should be an ipfs link to a token metadata for whatever fractional token you want to MoonSale.

To get this metadata link there are a set of steps you can take

First make an account at: https://nft.storage/

Then using the upload button, upload a jpeg or png file of what you want the fractional token to look like. For example if you're fractionalizing a bored ape, the image of a fractional bored ape might look like the bored ape with a moonlight watermark or stamp on top of it.

After you have uploaded this image, you should have the ability to copy the cid of the given image under the actions button.
The CID should look like the following 

bafkreibujqgxnobxxhscvhi5vd532d43yxn3wfdznqdd7s4tbnwpd7rimy

Appened https://ipfs.io/ipfs/ to the beginning of the cid to get the ipfs link for the image

https://ipfs.io/ipfs/bafkreibujqgxnobxxhscvhi5vd532d43yxn3wfdznqdd7s4tbnwpd7rimy

After you have done this, we now need to make a json file for the fractional token metadata

Create a JSON file locally with these fields.  Populate the fields with what you want to pop up under the description.

{
  "name": "" ,
  "description": "",
  "image": "",
  "seller_fee_basis_points": ,
  "fee_recipient": ""
}

name should be whatever you want to call the fractionalized token
description should be a short description of the fractionalied token
image should be the ipfs url we generated earlier
seller_fee_basis_points should be around 50 for .5% royalty (100 = 1%)  (only for non opensea platforms, opensea must be set manually)
fee_recipient should be the address of whoever the royalties should go to (only for non opensea platforms, opensea must be set manually)

a completed json file should look something like this

{
  "name": "Fractional Bharat",
  "description": "This is a fractional token representing fractional Bharats",
  "image": "https://ipfs.io/ipfs/bafybeic4rafu23xg5mx5h35bjvcpmmafunp4j4tg77ylbknd7qyxyunaiq",
  "seller_fee_basis_points": 50,
  "fee_recipient": "0xEbA93A26b8e152fe70E066DaE89eD548397fCbb7"
}

Then we want to upload this json file to NFT storage and get its cid.  Append https://ipfs.io/ipfs/ to the beginning of the ipfs cid of the JSON file for the fractional token URI.

FOURTH PARAMETER
The fourth parameter (tokenId) is just the id of the specific NFT we want to purchase from NFT.  If its bored ape 128, the id here would be 128.  If no id exists present you can set it to the value of 1.

With all four of these parameter, we should be able to deploy a MoonToken.  After deployment, login to opensea with the account that has the collectionOwner address. Go into my collections and they should see an admin token belonging to an unamed collection.  They can then edit the collection banner, the royalties and who the royalties should go to.

Finally, we must call the grantOwnerRole function on the MoonToken, passing in the address of the MoonSaleFactory, granting the MoonSaleFactory, owner role over our MoonToken. 

# 3) Calling newMoonSale in MoonSaleFactory

After we have done all of this we can now call the newMoonSale function in MoonSale Factory.

This function takes in the following parameters
            _rate,
            _tokenAddress,
            _opening_time,
            _closing_time,
            _price,
            _marketPlace,
            _transactionData

Lets go through these one by one

FIRST PARAMETER
_rate is the rate between wei and tkn bits.  There are 10^18 wei in one ETH, likewise there are 10^18 tknBits.  It is practical to do this because we receive all msg.values and payments internally in solidity in terms of wei, so we should do the same for tokens.  Therefore balances actually represent how many tknbits someone has, not how many tokens.  We do not allow partial tokens, however, so this is just for the purpose of math convenience.  The rate represents how much 1 wei is worth in terms of tknbits.  For example if the rate was 1, each wei would equal one tkn bit.  This means 10^18 wei = 10^18 tkn bits hence one eth = one token.  If we want to say .01 eth = one token, the rate would be 100, as each wei = 100 tokens, so 1 eth = 100 tokens, meaning .01 eth = 1 token.  

Therefore the default value should be 100

SECOND PARAMETER
_tokenAddress is the address of the MoonToken that is already deployed.  Make sure that token has granted the MoonSaleFactory owner role before passing it in.  

THIRD PARAMETER
_opening_time is the start time of the crowdsale.  Make sure this value is actually greater than the current time stamp, as we cannot and should not deploy a crowdsale which has already started.

FOURTH PARAMETER
_close_time is the end date of the crowdsale.  However many seconds you want the crowdsale to last, add that value to the start time and pass it in as the closing time

FIFTH PARAMETER
_price, the buyNowPrice of the NFT in wei.

SIXTH PARAMETER
_marketPlace, should be the address of the deployed seaport contract

SEVENTH PARAMETER
_transactionData, bytes representing the call data necessary to make the NFT purchase

Pass these in and call the function from an admin account, and you should deploy a new MoonSale.  Access that moonSale either with get latest MoonSale or by passing the count variable -1 to the array of moonSales.  Access any of the subcontracts within the MoonSale using the mappings provided.

Let me know if you have any questions
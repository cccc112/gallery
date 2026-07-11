// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract GalleryEscrow {
    address public owner;
    IERC20 public usdcToken;

    struct Rental {
        address tenant;
        address artist;
        uint256 depositAmount;
        bool isActive;
    }

    // Mapping from artworkId to Rental details
    mapping(string => Rental) public rentals;

    event RentalDeposited(string artworkId, address tenant, address artist, uint256 rentAmount, uint256 depositAmount);
    event DepositRefunded(string artworkId, address tenant, uint256 amount);
    event DepositClaimed(string artworkId, address artist, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _usdcTokenAddress) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcTokenAddress);
    }

    /**
     * @notice Tenant calls this to rent an artwork
     * @param artworkId UUID string of the artwork
     * @param artistWallet The address of the artist receiving rent
     * @param rentAmount The rent amount in USDC units (e.g. 6 decimals)
     * @param depositAmount The deposit amount in USDC units
     */
    function rentArtwork(
        string memory artworkId,
        address artistWallet,
        uint256 rentAmount,
        uint256 depositAmount
    ) external {
        require(!rentals[artworkId].isActive, "Artwork already rented");

        // 1. Transfer rent to artist directly
        if (rentAmount > 0) {
            require(usdcToken.transferFrom(msg.sender, artistWallet, rentAmount), "Rent transfer failed");
        }

        // 2. Transfer deposit to this escrow contract
        if (depositAmount > 0) {
            require(usdcToken.transferFrom(msg.sender, address(this), depositAmount), "Deposit transfer failed");
        }

        // 3. Record rental state
        rentals[artworkId] = Rental({
            tenant: msg.sender,
            artist: artistWallet,
            depositAmount: depositAmount,
            isActive: true
        });

        emit RentalDeposited(artworkId, msg.sender, artistWallet, rentAmount, depositAmount);
    }

    /**
     * @notice Admin or Artist calls this to refund deposit back to tenant after artwork is returned safely
     */
    function refundDeposit(string memory artworkId) external {
        Rental storage rental = rentals[artworkId];
        require(rental.isActive, "Rental not active");
        require(msg.sender == owner || msg.sender == rental.artist, "Not authorized");

        uint256 amount = rental.depositAmount;
        address tenant = rental.tenant;

        rental.isActive = false;
        rental.depositAmount = 0;

        if (amount > 0) {
            require(usdcToken.transfer(tenant, amount), "Refund transfer failed");
        }

        emit DepositRefunded(artworkId, tenant, amount);
    }

    /**
     * @notice Admin or Artist calls this to claim deposit for artist if artwork is damaged or not returned
     */
    function claimDeposit(string memory artworkId) external {
        Rental storage rental = rentals[artworkId];
        require(rental.isActive, "Rental not active");
        require(msg.sender == owner || msg.sender == rental.artist, "Not authorized");

        uint256 amount = rental.depositAmount;
        address artist = rental.artist;

        rental.isActive = false;
        rental.depositAmount = 0;

        if (amount > 0) {
            require(usdcToken.transfer(artist, amount), "Claim transfer failed");
        }

        emit DepositClaimed(artworkId, artist, amount);
    }
}

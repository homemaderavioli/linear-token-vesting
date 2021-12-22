// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVesting {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public owner;
    IERC20 public token;
    uint256 public startTime;
    uint256 public constant DURATION = 86400 * 365;
    uint256 public immutable maxSendableTokens;
    uint256 public sentTokens;

    struct Vest {
        uint256 total;
        uint256 vested;
    }

    mapping(address => Vest) public vests;

    constructor(
        IERC20 _token,
        uint256 _maxSendable,
        address[] memory _receivers,
        uint256[] memory _amounts
    ) {
        require(_receivers.length == _amounts.length, "_receivers len == _amounts len");
        token = _token;
        uint256 sendable;
        for (uint256 i = 0; i < _receivers.length; i++) {
            require(vests[_receivers[i]].total == 0, "vest must be 0");
            sendable = sendable.add(_amounts[i]);
            vests[_receivers[i]].total = _amounts[i];
        }
        require(sendable == _maxSendable, "vest total == _maxSendable");
        maxSendableTokens = sendable;
        owner = msg.sender;
    }

    function vestable(address _vestor) external view returns (uint256) {
        if (startTime == 0) return 0;
        Vest storage v = vests[_vestor];
        uint256 elapsedTime = block.timestamp.sub(startTime);
        if (elapsedTime > DURATION) elapsedTime = DURATION;
        uint256 _vestable = v.total.mul(elapsedTime).div(DURATION);
        return _vestable.sub(v.vested);
    }

    function start() external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        require(token.balanceOf(address(this)) == maxSendableTokens, "balance == maxSendableTokens");
        startTime = block.timestamp;
    }

    function vest() external {
        require(startTime != 0, "startTime must not be 0");
        Vest storage v = vests[msg.sender];
        uint256 elapsedTime = block.timestamp.sub(startTime);
        if (elapsedTime > DURATION) elapsedTime = DURATION;
        uint256 _vestable = v.total.mul(elapsedTime).div(DURATION);
        if (_vestable > v.vested) {
            uint256 amount = _vestable.sub(v.vested);
            sentTokens = sentTokens.add(amount);
            require(sentTokens <= maxSendableTokens, "cannot send that amount");
            token.safeTransfer(msg.sender, amount);
            v.vested = _vestable;
        }
    }

    function withdraw() external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner, balance);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Inbox
/// @notice An on-chain message board. Anyone can post a message; every message is
///         kept with its author and timestamp, and the latest one is the "current" message.
contract Inbox {
    struct Message {
        address author;
        uint64 timestamp;
        string text;
    }

    /// @notice Longest message accepted, in bytes.
    uint256 public constant MAX_LENGTH = 280;

    address public immutable owner;
    bool public paused;

    Message[] private _messages;

    event MessagePosted(uint256 indexed id, address indexed author, string text);
    event Paused(bool paused);

    error EmptyMessage();
    error MessageTooLong(uint256 length, uint256 maxLength);
    error NotOwner();
    error InboxPaused();
    error NoSuchMessage(uint256 id);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(string memory initialMessage) {
        owner = msg.sender;
        _post(initialMessage);
    }

    /// @notice Post a new message. It becomes the current message.
    function setMessage(string calldata text) external {
        if (paused) revert InboxPaused();
        _post(text);
    }

    /// @notice The latest message's text.
    function message() external view returns (string memory) {
        return _messages[_messages.length - 1].text;
    }

    /// @notice The latest message with its author and timestamp.
    function latest() external view returns (Message memory) {
        return _messages[_messages.length - 1];
    }

    /// @notice A message by id (0 is the initial message).
    function getMessage(uint256 id) external view returns (Message memory) {
        if (id >= _messages.length) revert NoSuchMessage(id);
        return _messages[id];
    }

    /// @notice How many messages have been posted, including the initial one.
    function messageCount() external view returns (uint256) {
        return _messages.length;
    }

    /// @notice Stop or resume new posts. Only the deployer can do this.
    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit Paused(value);
    }

    function _post(string memory text) private {
        uint256 length = bytes(text).length;
        if (length == 0) revert EmptyMessage();
        if (length > MAX_LENGTH) revert MessageTooLong(length, MAX_LENGTH);

        _messages.push(Message(msg.sender, uint64(block.timestamp), text));
        emit MessagePosted(_messages.length - 1, msg.sender, text);
    }
}

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Inbox", function () {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const inbox = await ethers.deployContract("Inbox", ["Hi there!"]);
    return { inbox, owner, alice, bob };
  }

  describe("deployment", function () {
    it("stores the initial message as message #0", async function () {
      const { inbox, owner } = await loadFixture(deployFixture);
      expect(await inbox.message()).to.equal("Hi there!");
      expect(await inbox.messageCount()).to.equal(1n);
      const first = await inbox.getMessage(0);
      expect(first.author).to.equal(owner.address);
      expect(first.text).to.equal("Hi there!");
    });

    it("sets the deployer as owner", async function () {
      const { inbox, owner } = await loadFixture(deployFixture);
      expect(await inbox.owner()).to.equal(owner.address);
    });

    it("rejects an empty initial message", async function () {
      const Inbox = await ethers.getContractFactory("Inbox");
      await expect(Inbox.deploy("")).to.be.revertedWithCustomError(Inbox, "EmptyMessage");
    });
  });

  describe("posting", function () {
    it("updates the current message and keeps history", async function () {
      const { inbox, alice, bob } = await loadFixture(deployFixture);
      await inbox.connect(alice).setMessage("hello from alice");
      await inbox.connect(bob).setMessage("hello from bob");

      expect(await inbox.message()).to.equal("hello from bob");
      expect(await inbox.messageCount()).to.equal(3n);
      expect((await inbox.getMessage(1)).author).to.equal(alice.address);
      expect((await inbox.latest()).author).to.equal(bob.address);
    });

    it("records the block timestamp", async function () {
      const { inbox, alice } = await loadFixture(deployFixture);
      await inbox.connect(alice).setMessage("timed");
      expect((await inbox.latest()).timestamp).to.equal(BigInt(await time.latest()));
    });

    it("emits MessagePosted with id, author and text", async function () {
      const { inbox, alice } = await loadFixture(deployFixture);
      await expect(inbox.connect(alice).setMessage("event!"))
        .to.emit(inbox, "MessagePosted")
        .withArgs(1n, alice.address, "event!");
    });

    it("rejects empty messages", async function () {
      const { inbox } = await loadFixture(deployFixture);
      await expect(inbox.setMessage("")).to.be.revertedWithCustomError(inbox, "EmptyMessage");
    });

    it("accepts exactly MAX_LENGTH bytes and rejects one more", async function () {
      const { inbox } = await loadFixture(deployFixture);
      const max = Number(await inbox.MAX_LENGTH());
      await expect(inbox.setMessage("a".repeat(max))).not.to.be.reverted;
      await expect(inbox.setMessage("a".repeat(max + 1)))
        .to.be.revertedWithCustomError(inbox, "MessageTooLong")
        .withArgs(max + 1, max);
    });

    it("reverts for an unknown message id", async function () {
      const { inbox } = await loadFixture(deployFixture);
      await expect(inbox.getMessage(5))
        .to.be.revertedWithCustomError(inbox, "NoSuchMessage")
        .withArgs(5n);
    });
  });

  describe("pausing", function () {
    it("lets the owner pause and resume posting", async function () {
      const { inbox, alice } = await loadFixture(deployFixture);
      await expect(inbox.setPaused(true)).to.emit(inbox, "Paused").withArgs(true);
      await expect(inbox.connect(alice).setMessage("blocked"))
        .to.be.revertedWithCustomError(inbox, "InboxPaused");

      await inbox.setPaused(false);
      await expect(inbox.connect(alice).setMessage("back")).not.to.be.reverted;
    });

    it("does not let others pause", async function () {
      const { inbox, alice } = await loadFixture(deployFixture);
      await expect(inbox.connect(alice).setPaused(true))
        .to.be.revertedWithCustomError(inbox, "NotOwner");
    });
  });
});

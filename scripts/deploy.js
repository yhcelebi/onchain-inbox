const { ethers, network } = require("hardhat");

async function main() {
  const initialMessage = process.env.INITIAL_MESSAGE || "Hello, chain!";
  const inbox = await ethers.deployContract("Inbox", [initialMessage]);
  await inbox.waitForDeployment();

  console.log(`Inbox deployed to ${await inbox.getAddress()} on ${network.name}`);
  console.log(`Initial message: "${await inbox.message()}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

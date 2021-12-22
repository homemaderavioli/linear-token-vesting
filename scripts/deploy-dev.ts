// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const testSupply = ethers.utils.parseEther("1000000000000000");

  // const accounts = await ethers.getSigners();

  const ownerAcc = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

  const receiver1 = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  const receiver2 = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

  const receiver1Amount = testSupply.div(4);
  const receiver2Amount = testSupply.div(4);

  // We get the contract to deploy
  const TestBFTToken = await ethers.getContractFactory("TestToken");
  const testor = await TestBFTToken.deploy(testSupply._hex);

  await testor.deployed();

  console.log("Testor Token deployed to:", testor.address);

  // We get the contract to deploy
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vestor = await TokenVesting.deploy(
    testor.address,
    testSupply.div(2),
    [receiver1, receiver2],
    [receiver1Amount, receiver2Amount]
  );
  console.log([receiver1Amount.toString(), receiver2Amount.toString()]);

  await vestor.deployed();
  console.log("Vestor deployed to:", vestor.address);

  const sendable = await vestor.maxSendableTokens();
  console.log("maxSendableTokens: ", sendable);

  const sent = await vestor.sentTokens();
  console.log("sent: ", sent);

  const vest1 = await vestor.vests(receiver1);
  console.log("vest1: ", vest1);

  const vest2 = await vestor.vests(receiver2);
  console.log("vest2: ", vest2);

  await testor.transfer(vestor.address, testSupply.div(2));

  const ownerBalance = await testor.balanceOf(ownerAcc);
  console.log(`Owner balance ${ownerBalance}`);
  const vestorBalance = await testor.balanceOf(vestor.address);
  console.log(`Vestor balance ${vestorBalance}`);

  await vestor.start();
  const startTime = await vestor.startTime();
  console.log(`Vestor start time: ${startTime}`);

  const vestable1 = await vestor.vestable(receiver1);
  console.log(`Vestable for receiver1 amount: ${vestable1}`);

  const vestable2 = await vestor.vestable(receiver2);
  console.log(`Vestable for receiver2 amount: ${vestable2}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

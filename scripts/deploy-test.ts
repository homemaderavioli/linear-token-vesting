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

  const ownerAcc = "0xD8Ec4e985606d7964D7c02c7ac028358bFcC81F8";
  const receiverAcc = "0x6428f761Ee1532a7b6CB451B9B6979B60670a719";

  // We get the contract to deploy
  const TestBFTToken = await ethers.getContractFactory("TestBFT");
  const testor = await TestBFTToken.deploy(testSupply._hex);

  await testor.deployed();

  console.log("Testor Token deployed to:", testor.address);

  // await testor.transfer(acc1, 50000);

  // console.log(`Send ${acc1} 50000 ${await testor.symbol()}`);

  const token = testor.address;

  // We get the contract to deploy
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vestor = await TokenVesting.deploy(token, receiverAcc);

  await vestor.deployed();

  console.log("Vestor deployed to:", vestor.address);

  await testor.transfer(vestor.address, testSupply.div(2));

  const ownerBalance = await testor.balanceOf(ownerAcc);
  console.log(`Owner balance ${ownerBalance}`);
  const vestorBalance = await testor.balanceOf(vestor.address);
  console.log(`Vestor balance ${vestorBalance}`);

  await vestor.start(testSupply.div(2)._hex);
  const startTime = await vestor.startTime();
  console.log(`Vestor start time: ${startTime}`);

  const vestable = await vestor.vestable();
  console.log(`Vestable amount: ${vestable}`);

  await vestor.connect(receiverAcc).vestable();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

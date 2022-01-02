// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const ownerAcc = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

  const receiver1 = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  const receiver2 = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

  const testTokenAddr = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.attach(testTokenAddr);

  const tokenVestingAddr = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.attach(tokenVestingAddr);

  const vestable1 = await tokenVesting.vestable(receiver1);
  console.log("Vestable1: ", vestable1);

  const vestable2 = await tokenVesting.vestable(receiver2);
  console.log("Vestable2: ", vestable2);

  const recSigner = await ethers.provider.getSigner(receiver1);
  const tx = await tokenVesting.connect(recSigner).vest();

  tx.wait(1);

  const vests = await tokenVesting.vests(receiver1);
  console.log("Vest: ", [vests.vested, vests.total]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

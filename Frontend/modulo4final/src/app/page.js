"use client";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "./abi";


function App() {
  const CONTRACT_ADDRESS = "0x1A6497397D9c0ac0557bfB396a937343a76750D8";


  const account = useAccount();
  const { connectors, connect, status, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();


  const [stakeAmount, setStakeAmount] = useState("");
  const [error, setError] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");


  const result = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "balances",
    args: [account.address],
  });


  const handleStake = async () => {
    console.log("Stake button pressed");
    console.log("Stake amount:", stakeAmount);
    console.log("Account status:", account.status);
    console.log("Account address:", account.address);


    if (!stakeAmount) {
      console.error("Stake amount is empty");
      setError("Stake amount is empty");
      return;
    }


    setIsStaking(true);
    setError("");
    setTransactionHash("");


    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);


        const amountInWei = ethers.utils.parseEther(stakeAmount);
       
        // Call the stake function
        const tx = await contract.stake({ value: amountInWei });


        setTransactionHash(tx.hash);
        console.log("Transaction sent:", tx.hash);


        // Wait for the transaction to be mined
        await tx.wait();
        console.log("Transaction confirmed");
      } else {
        throw new Error("Ethereum object not found, do you have MetaMask installed?");
      }
    } catch (error) {
      console.error("Stake execution error:", error);
      setError(error.message);
    } finally {
      setIsStaking(false);
    }
  };


  return (
    <>
      <div>
        <h1>Stacker</h1>
        {result?.data && <p>My balance: {ethers.utils.formatEther(result.data)} ETH</p>}
        <h2>Account</h2>


        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>


        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>


      <div>
        <h2>Connect</h2>
        {connectors.slice(0, 1).map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>Connection status: {status}</div>
        {connectError && <div>Connection error: {connectError.message}</div>}
      </div>


      <div>
        <h2>Stake Tokens</h2>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Enter amount to stake in ETH"
        />
        <button
          onClick={handleStake}
          disabled={!stakeAmount || isStaking}
        >
          {isStaking ? "Processing..." : "Stake"}
        </button>
        {error && <div>Error: {error}</div>}
        {transactionHash && <div>Transaction sent: {transactionHash}</div>}
      </div>
    </>
  );
}


export default App;


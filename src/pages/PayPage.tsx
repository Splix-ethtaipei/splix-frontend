import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import axios from 'axios';
import './PayPage.css';

// Contract Addresses
const AVALANCHE_FUJI_USDC = '0x5425890298aed601595a70AB815c96711a31Bc65'
const AVALANCHE_FUJI_TOKEN_MESSENGER = '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa'

// Hardcoded data for relay transaction
let relay_tx_data = {
  txHash: "0x26657f019eb37bdb2e999d3886a535c00ff2d5ea8e588c5f3afc3774f903e53d",
  groupId: 0,
  itemIds: [0, 1, 2, 3],
  amount: 720000
};

// ABI definitions
const usdcABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  }
];

const tokenMessengerABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [],
  }
];

const PayPage = () => {
  const { isConnected } = useAppKitAccount();
  const [txStep, setTxStep] = useState<
    'idle' | 'approving' | 'burning' | 'processing' | 'complete'
  >('idle');
  const [processingStep, setProcessingStep] = useState<
    'idle' | 'polling' | 'receiving' | 'transferring'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Approve USDC transaction
  const { writeContract: approveUSDC, data: approveTxHash } = useWriteContract();
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  // Burn USDC transaction
  const { writeContract: burnUSDC, data: burnTxHash } = useWriteContract();
  const { isSuccess: isBurnSuccess } = 
    useWaitForTransactionReceipt({
      hash: burnTxHash,
    });

  // Handle approve USDC
  const handleApproveUSDC = async (amount: number) => {
    try {
      setTxStep('approving');
      setError(null);
      
      approveUSDC({
        address: AVALANCHE_FUJI_USDC,
        abi: usdcABI,
        functionName: 'approve',
        args: [AVALANCHE_FUJI_TOKEN_MESSENGER, BigInt(amount) * 2n], // Double for safety
      });
    } catch (err) {
      console.error('Error approving USDC:', err);
      setError(`Error approving USDC: ${err instanceof Error ? err.message : String(err)}`);
      setTxStep('idle');
    }
  };

  // Handle burn USDC
  const handleBurnUSDC = useCallback(async (amount: number) => {
    try {
      setTxStep('burning');
      setError(null);
      setProgress(0);
      
      // DESTINATION_ADDRESS - placeholder for demonstration
      const DESTINATION_ADDRESS = '0x827B3566BDb3f4A1b18AFD6d8951396040A2F8aF';
      const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${DESTINATION_ADDRESS.slice(2)}`;
      
      // DESTINATION_CALLER_BYTES32 - placeholder for demonstration
      const DESTINATION_CALLER_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Chain-specific Parameters - placeholders for demonstration
      const AVALANCHE_FUJI_DOMAIN = 0;
      const MAX_FEE = 500n;

      burnUSDC({
        address: AVALANCHE_FUJI_TOKEN_MESSENGER,
        abi: tokenMessengerABI,
        functionName: 'depositForBurn',
        args: [
          amount,
          AVALANCHE_FUJI_DOMAIN,
          DESTINATION_ADDRESS_BYTES32,
          AVALANCHE_FUJI_USDC,
          DESTINATION_CALLER_BYTES32,
          MAX_FEE,
          1000, // minFinalityThreshold
        ],
      });
    } catch (err) {
      console.error('Error burning USDC:', err);
      setError(`Error burning USDC: ${err instanceof Error ? err.message : String(err)}`);
      setTxStep('idle');
    }
  }, [burnUSDC, setTxStep, setError, setProgress]);

  // Call relay transaction API
  const callRelayTx = useCallback(async () => {
    try {
      setTxStep('processing');
      setProcessingStep('polling');
      setProgress(0);

      // Simulate different loading speeds for different phases
      await simulateLoadingProgress('polling', 0, 33, 1500); // 10 second duration
      
      setProcessingStep('receiving');
      await simulateLoadingProgress('receiving', 33, 66, 2500); // 5 second duration
      
      setProcessingStep('transferring');
      await simulateLoadingProgress('transferring', 66, 100, 1000); // 7 second duration

      // Make sure burnTxHash is defined before using it
      if (burnTxHash) {
        relay_tx_data.txHash = burnTxHash as string;
      } else {
        console.error("Transaction hash is undefined");
        // You might want to use a fallback or show an error
      }

      // Actually make the API call at the end
      const response = await axios.post('http://localhost:3000/api/relay-tx', relay_tx_data);
      console.log('Relay transaction response:', response.data);
      
      setTxStep('complete');
    } catch (err) {
      console.error('Error relaying transaction:', err);
      setError(`Error relaying transaction: ${err instanceof Error ? err.message : String(err)}`);
      setTxStep('idle');
    }
  }, [setTxStep, setProcessingStep, setProgress, setError, burnTxHash]);

  // Simulate loading progress with different speeds
  const simulateLoadingProgress = async (_step: string, startPercent: number, endPercent: number, duration: number) => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    return new Promise<void>((resolve) => {
      const updateProgress = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = startPercent + ((elapsed / duration) * (endPercent - startPercent));
        
        if (currentTime >= endTime) {
          setProgress(endPercent);
          resolve();
          return;
        }
        
        setProgress(Math.min(progress, endPercent));
        requestAnimationFrame(updateProgress);
      };
      
      updateProgress();
    });
  };

  // Effect to monitor transaction statuses and proceed with the flow
  useEffect(() => {
    if (txStep === 'approving' && isApproveSuccess) {
      console.log('USDC approval confirmed!');
      setTxStep('burning');
      handleBurnUSDC(relay_tx_data.amount);
    } else if (txStep === 'burning' && isBurnSuccess && burnTxHash) { // Check burnTxHash exists
      console.log('USDC burn confirmed! Transaction hash:', burnTxHash);
      callRelayTx();
    }
  }, [txStep, isApproveSuccess, isBurnSuccess, burnTxHash, callRelayTx, handleBurnUSDC]);

  // Reset function
  const resetProcess = () => {
    setTxStep('idle');
    setProcessingStep('idle');
    setProgress(0);
    setError(null);
  };

  return (
    <div className="result-content">
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
      </div>
      <h1>Finalize Your Payment</h1>
      
      {isConnected ? (
        <div className="result-details">
          <div className="status-container">
            <h3>Current Status: {txStep}</h3>
            {error && <p className="error">{error}</p>}
          </div>
          
          <div className="action-container">
            {txStep === 'idle' && (
              <button 
                className="submit-changes-button"
                onClick={() => handleApproveUSDC(relay_tx_data.amount)}
                disabled={isApproveLoading}
              >
                {isApproveLoading ? 'Approving...' : 'Approve & Burn USDC'}
              </button>
            )}
            
            {txStep === 'approving' && (
              <div className="waiting-container">
                <div className="spinner"></div>
                <p>Approving USDC...</p>
              </div>
            )}
            
            {txStep === 'burning' && (
              <div className="waiting-container">
                <div className="spinner"></div>
                <p>Burning USDC...</p>
              </div>
            )}
            
            {txStep === 'processing' && (
              <div className="processing-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p>
                  {processingStep === 'polling' && 'Relayer polling attestation...'}
                  {processingStep === 'receiving' && 'Relayer calling receiveMessage...'}
                  {processingStep === 'transferring' && 'Transferring tokens to the owner of the group...'}
                </p>
              </div>
            )}
            
            {txStep === 'complete' && (
              <div className="complete-container">
                <h3>Payment Successful! 🎉</h3>
                <p>Your transaction has been successfully processed.</p>
                <button 
                  className="submit-changes-button"
                  onClick={resetProcess}
                >
                  Start New Payment
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="connect-prompt">
          <p>Please connect your wallet to continue</p>
          <appkit-button />
        </div>
      )}
    </div>
  );
};

export default PayPage;
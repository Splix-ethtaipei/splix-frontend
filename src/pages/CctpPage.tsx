import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { Hex } from 'viem'
import axios from 'axios'
import './CctpPage.css'

// Contract Addresses
const ETHEREUM_SEPOLIA_USDC = '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'
const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
    '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa'
const AVALANCHE_FUJI_MESSAGE_TRANSMITTER =
    '0xe737e5cebeeba77efe34d4aa090756590b1ce275'

// Transfer Parameters
const DESTINATION_ADDRESS = '0xd4f42C1DaA53Cf5d4E96A1514e91F45c28C2e3eD'
const AMOUNT = 1_000_000n // Set transfer amount in 10^6 subunits (1 USDC; change as needed)
const MAX_FEE = 500n // Set fast transfer max fee in 10^6 subunits (0.0005 USDC; change as needed)

// Bytes32 Formatted Parameters
const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${DESTINATION_ADDRESS.slice(2)}` // Destination address in bytes32 format
const DESTINATION_CALLER_BYTES32 =
    '0x0000000000000000000000000000000000000000000000000000000000000000' // Empty bytes32 allows any address to call MessageTransmitterV2.receiveMessage()

// Chain-specific Parameters
const ETHEREUM_SEPOLIA_DOMAIN = 0 // Source domain ID for Ethereum Sepolia testnet
const AVALANCHE_FUJI_DOMAIN = 1 // Destination domain ID for Avalanche Fuji testnet

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
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  }
]

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
]

const messageTransmitterABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  }
]

const CctpPage = () => {
  const { isConnected, address } = useAppKitAccount()
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'burning' | 'waiting' | 'minting' | 'complete'>('idle')
  const [currentTxHash, setCurrentTxHash] = useState<Hex | undefined>()
  const [attestation, setAttestation] = useState<{ message: string; attestation: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ============ Check USDC Allowance ============
  const { data: allowanceData } = useReadContract({
    address: ETHEREUM_SEPOLIA_USDC,
    abi: usdcABI,
    functionName: 'allowance',
    args: [address, ETHEREUM_SEPOLIA_TOKEN_MESSENGER],
    query: {
      enabled: !!address,
    },
  })

  const allowance = allowanceData ? BigInt(allowanceData.toString()) : 0n

  // ============ Approve USDC ============
  const { writeContract: approveUSDC, data: approveTxHash } = useWriteContract()
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })

  // ============ Burn USDC ============
  const { writeContract: burnUSDC, data: burnTxHash } = useWriteContract()
  const { isLoading: isBurnLoading, isSuccess: isBurnSuccess } = useWaitForTransactionReceipt({
    hash: burnTxHash,
  })

  // ============ Mint USDC ============
  const { writeContract: mintUSDC, data: mintTxHash } = useWriteContract()
  const { isLoading: isMintLoading, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  })

  // Handle approve USDC
  const handleApproveUSDC = async () => {
    try {
      setTxStep('approving')
      setError(null)
      
      approveUSDC({
        address: ETHEREUM_SEPOLIA_USDC,
        abi: usdcABI,
        functionName: 'approve',
        args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, AMOUNT * 2n], // Double for safety
      })
    } catch (err) {
      console.error('Error approving USDC:', err)
      setError(`Error approving USDC: ${err instanceof Error ? err.message : String(err)}`)
      setTxStep('idle')
    }
  }

  // Handle burn USDC
  const handleBurnUSDC = async () => {
    try {
      setTxStep('burning')
      setError(null)
      
      burnUSDC({
        address: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
        abi: tokenMessengerABI,
        functionName: 'depositForBurn',
        args: [
          AMOUNT,
          AVALANCHE_FUJI_DOMAIN,
          DESTINATION_ADDRESS_BYTES32,
          ETHEREUM_SEPOLIA_USDC,
          DESTINATION_CALLER_BYTES32,
          MAX_FEE,
          1000, // minFinalityThreshold (1000 or less for Fast Transfer)
        ],
      })
    } catch (err) {
      console.error('Error burning USDC:', err)
      setError(`Error burning USDC: ${err instanceof Error ? err.message : String(err)}`)
      setTxStep('idle')
    }
  }

  // Retrieve attestation
  const retrieveAttestation = async (transactionHash: Hex) => {
    setTxStep('waiting')
    setError(null)
    
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`
    
    // Poll for attestation every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(url)
        
        if (response.data?.messages?.[0]?.status === 'complete') {
          console.log('Attestation retrieved successfully!', response.data.messages[0])
          setAttestation({
            message: response.data.messages[0].message,
            attestation: response.data.messages[0].attestation,
          })
          clearInterval(interval)
        } else {
          console.log('Waiting for attestation...')
        }
      } catch (err) {
        console.log('Waiting for attestation...', err instanceof Error ? err.message : String(err))
        // Don't clear interval on error, keep trying
      }
    }, 5000)

    // Cleanup function
    return () => clearInterval(interval)
  }

  // Handle mint USDC
  const handleMintUSDC = async () => {
    if (!attestation) {
      setError('No attestation available yet')
      return
    }

    try {
      setTxStep('minting')
      setError(null)
      
      mintUSDC({
        address: AVALANCHE_FUJI_MESSAGE_TRANSMITTER,
        abi: messageTransmitterABI,
        functionName: 'receiveMessage',
        args: [attestation.message, attestation.attestation],
      })
    } catch (err) {
      console.error('Error minting USDC:', err)
      setError(`Error minting USDC: ${err instanceof Error ? err.message : String(err)}`)
      setTxStep('idle')
    }
  }

  // Effect to monitor transaction statuses and proceed with the flow
  useEffect(() => {
    if (txStep === 'approving' && isApproveSuccess) {
      console.log('USDC approval confirmed!')
      setCurrentTxHash(approveTxHash)
    } else if (txStep === 'burning' && isBurnSuccess && burnTxHash) {
      console.log('USDC burn confirmed! Transaction hash:', burnTxHash)
      setCurrentTxHash(burnTxHash)
      retrieveAttestation(burnTxHash)
    } else if (txStep === 'waiting' && attestation) {
      setTxStep('minting')
    } else if (txStep === 'minting' && isMintSuccess) {
      console.log('USDC minting confirmed!')
      setTxStep('complete')
    }
  }, [
    txStep, isApproveSuccess, isBurnSuccess, isMintSuccess, 
    approveTxHash, burnTxHash, attestation
  ])

  // Check if user has sufficient allowance before burning
  const canBurn = allowance >= AMOUNT
  
  // Reset function
  const resetProcess = () => {
    setTxStep('idle')
    setCurrentTxHash(undefined)
    setAttestation(null)
    setError(null)
  }

  return (
    <div className="cctp-page">
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
      </div>
      <h1>Cross-Chain Transfer Protocol Demo</h1>
      <p className="description">
        Transfer USDC between Ethereum Sepolia and Arbitrum Sepolia using Circle's CCTP
      </p>
      {isConnected ? (
        <div className="cctp-container">
          <div className="status-container">
            <h3>Current status: {txStep}</h3>
            {error && <p className="error">{error}</p>}
            {currentTxHash && (
              <p>
                Transaction hash: <a href={`https://sepolia.etherscan.io/tx/${currentTxHash}`} target="_blank" rel="noopener noreferrer">
                  {currentTxHash.slice(0, 10)}...{currentTxHash.slice(-8)}
                </a>
              </p>
            )}
          </div>
          
          <div className="action-container">
            {txStep === 'idle' && (
              <>
                <button 
                  className="action-button"
                  onClick={handleApproveUSDC}
                  disabled={isApproveLoading}
                >
                  {isApproveLoading ? 'Approving...' : 'Step 1: Approve USDC'}
                </button>
                <div className="info">
                  Current allowance: {allowance.toString()} (need {AMOUNT.toString()})
                </div>
              </>
            )}
            
            {txStep === 'approving' && isApproveSuccess && (
              <button 
                className="action-button"
                onClick={handleBurnUSDC}
                disabled={isBurnLoading || !canBurn}
              >
                {isBurnLoading ? 'Burning...' : 'Step 2: Burn USDC'}
              </button>
            )}
            
            {txStep === 'waiting' && (
              <div className="waiting-container">
                <div className="spinner"></div>
                <p>Waiting for attestation from Circle...</p>
              </div>
            )}
            
            {txStep === 'minting' && !isMintSuccess && (
              <button 
                className="action-button"
                onClick={handleMintUSDC}
                disabled={isMintLoading || !attestation}
              >
                {isMintLoading ? 'Minting...' : 'Step 3: Mint USDC on Avalanche Fuji Testnet'}
              </button>
            )}
            
            {txStep === 'complete' && (
              <div className="complete-container">
                <h3>Transfer complete! 🎉</h3>
                <button 
                  className="action-button reset-button"
                  onClick={resetProcess}
                >
                  Start New Transfer
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
  )
}

export default CctpPage
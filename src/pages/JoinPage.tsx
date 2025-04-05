import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppKitAccount } from '@reown/appkit/react';
import './JoinPage.css';

// Mock data structure
interface GroupData {
  id: string;
  name: string;
}

const mockJoinGroup = async (groupId: string, address: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const mockCancelJoin = async (groupId: string, address: string, chainId: number) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const mockGroupData: GroupData = {
  id: "1",
  name: "Test Group"
};

export default function JoinPage() {
  const { groupId, chainId } = useParams();
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const baseUrl = import.meta.env.VITE_API_ENDPOINT || '';

  useEffect(() => {
    const validateGroup = async () => {
      try {
        setIsLoading(true);
        // For now using mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In production, fetch group data here
        // const response = await fetch(`/api/groups/${groupId}`);
        // if (!response.ok) throw new Error('Invalid group');
        // const data = await response.json();

        setGroupData(mockGroupData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    validateGroup();
  }, [groupId]);

  const handleJoin = async () => {
    if (!address || !groupId) return;

    try {
      setIsJoining(true);
      const response = await fetch(`${baseUrl}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, user: address, chainId: Number(chainId) }),
      });

      if (!response.ok) {
        throw new Error('Failed to join group');
      }

      const result = await response.json();
      if (result.success) {
        navigate(`/result/${groupId}/${chainId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancel = async () => {
    if (!address || !groupId) return;

    try {
      setIsCancelling(true);
      // In production, replace with real API call
      const result = await mockCancelJoin(groupId, address, Number(chainId));

      if (result.success) {
        navigate('/'); // Navigate back to home
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel join request');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="join-page">
        <div className="header">
          <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        </div>
        <div className="join-content">
          <h1>Validating group...</h1>
        </div>
      </div>
    );
  }

  if (error || !groupData) {
    return (
      <div className="join-page">
        <div className="header">
          <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        </div>
        <div className="join-content">
          <h1>Error</h1>
          <p className="error-message">{error || 'Group not found'}</p>
          <button
            className="nav-button"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
      </div>
      <div className="join-content">
        <h1>Do you want to join "{groupData.name}"?</h1>
        {!address ? (
          <div className="connect-wallet">
            <p>Please connect your wallet to join the group</p>
            {/* Add your wallet connect button here */}
          </div>
        ) : (
          <div className="join-actions">
            <div className="button-group">
              <button
                className="join-button"
                onClick={handleJoin}
                disabled={isJoining || isCancelling}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
              <button
                className="cancel-button"
                onClick={handleCancel}
                disabled={isCancelling || isJoining}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
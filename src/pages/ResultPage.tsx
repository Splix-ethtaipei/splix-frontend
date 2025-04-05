import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppKitAccount } from '@reown/appkit/react';
import { QRCodeSVG } from 'qrcode.react';
import { mockGenerateInviteCode } from '../services/inviteService';
import { mockUpdateItem } from '../services/updateService';
import './ResultPage.css';

interface ResultData {
  id: number;
  name: string;
  owner: string;
  items: {
    id: number;
    name: string;
    price: number;
    haspaid: boolean;
    payer: string;
  }[];
  members: string[];
}

// Add mock data
const mockResultData: ResultData = {
  id: 1,
  name: "abc",
  owner: "bcd",
  items: [
    {
      id: 1,
      name: "food a",
      price: 1234,
      haspaid: true,
      payer: "0xabc"
    },
    {
      id: 2,
      name: "food b",
      price: 1234,
      haspaid: false,
      payer: "0xabc"
    },
    {
      id: 3,
      name: "food d",
      price: 1234,
      haspaid: false,
      payer: "0xabc"
    }
  ],
  members: ["0xfA6cF974baf5F5589afF6364180D54fd0b2428F2"]
};

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, chainid } = useParams();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [localData, setLocalData] = useState<ResultData | null>(null);
  const { address } = useAppKitAccount();
  const [newMember, setNewMember] = useState('');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_ENDPOINT || '';

  // Replace hardcoded isOwner with comparison
  const isOwner = resultData?.owner?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        if (baseUrl) {
          // Use real API when baseUrl is available
          const response = await fetch(`${baseUrl}/groups/${id}/${chainid}`);
          if (!response.ok) {
            throw new Error('Failed to fetch result');
          }
          const data = await response.json();
          setResultData(data);
          setLocalData(data);
        } else {
          // Use mock data when baseUrl is empty
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
          setResultData(mockResultData);
          setLocalData(mockResultData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching result:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, chainid, baseUrl]);

  const generateInviteLink = async () => {
    if (!id || !chainid) return;

    setIsGenerating(true);
    try {
      // Simplified link generation without invite code
      const link = `${window.location.origin}/join/${id}/${chainid}`;
      setInviteLink(link);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating invite link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const closeQRModal = () => {
    setShowQR(false);
    setInviteLink('');
  };

  const handleAddMember = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMember.trim()) {
      e.preventDefault();

      if (!resultData) {
        setError('No result data available');
        return;
      }

      const trimmedMember = newMember.trim();
      if (!resultData.members.includes(trimmedMember)) {
        // // Actual API call would go here
        // await updateMembers([...resultData.members, trimmedMember]);

        setResultData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            members: [...prev.members, trimmedMember]
          };
        });
      }
      setNewMember('');
    }
  };

  const handleRemoveMember = (memberToRemove: string) => {
    if (!resultData) return;

    const updatedMembers = resultData.members.filter(member => member !== memberToRemove);
    setResultData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        members: updatedMembers
      };
    });
    setLocalData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        members: updatedMembers
      };
    });
  };

  const handleEditItem = (index: number, field: 'name' | 'price' | 'haspaid' | 'payer', value: string | boolean | number) => {
    if (!localData) return;

    const updatedItems = localData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLocalData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleSubmitChanges = async () => {
    if (!id || !localData) return;

    setIsSubmitting(true);
    try {
      await mockUpdateItem({ id, items: localData.items });
      setResultData(localData);
    } catch (error) {
      console.error('Error updating items:', error);
      setLocalData(resultData); // Reset local data to previous state
      // Optionally show error to user
      setError('Failed to update items');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pages">
        <div className="header">
          <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        </div>
        <div className="result-content">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="pages">
        <div className="header">
          <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        </div>
        <div className="result-content">
          <h1>{error || 'Item Not Found'}</h1>
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
    <div className="pages">
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        <button
          className="nav-button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>

      <div className="result-content">
        <h1>Item Details</h1>

        <div className="result-details">
          <div className="ownership-status">
            {/* <span className="owner-badge">You are the owner</span> */}
            {isOwner && (
              <button
                className="generate-qr-button"
                onClick={generateInviteLink}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Invite QR'}
              </button>
            )}
          </div>

          <h2>{resultData.name}</h2>

          <div className="result-section">
            <h3>Members:</h3>
            {isOwner && (
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={handleAddMember}
                placeholder="Enter member address and press Enter"
                className="member-input"
              />
            )}
            {resultData.members.length > 0 ? (
              <ul className="members-list">
                {resultData.members.map((member, index) => (
                  <li key={index} className="member-item">
                    {member}
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="remove-button"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No members added</p>
            )}
          </div>

          <div className="result-section">
            <h3>Items:</h3>
            <ul className="items-list">
              {localData?.items.map((item, index) => (
                <li key={index} className="item-entry">
                  {editingItem === index ? (
                    <div className="item-edit">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleEditItem(index, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleEditItem(index, 'price', Number(e.target.value))}
                        placeholder="Price"
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={item.haspaid}
                          onChange={(e) => handleEditItem(index, 'haspaid', e.target.checked)}
                        />
                        Paid
                      </label>
                      <input
                        type="text"
                        value={item.payer}
                        onChange={(e) => handleEditItem(index, 'payer', e.target.value)}
                        placeholder="Payer address"
                      />
                      <button onClick={handleSubmitChanges} className="save-button">
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="item-display">
                      <span>
                        <strong>{item.name}</strong> - ${item.price}
                        {item.haspaid && ` (Paid by ${item.payer})`}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => setEditingItem(index)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="changes-actions">
              <button
                onClick={handleSubmitChanges}
                className="submit-changes-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="qr-modal-overlay">
          <div className="qr-modal">
            <button className="close-modal" onClick={closeQRModal}>×</button>
            <h3>Share Invite Link</h3>
            <div className="qr-code">
              <QRCodeSVG value={inviteLink} size={200} />
            </div>
            <div className="invite-link">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="link-input"
              />
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                }}
              >
                Copy
              </button>
            </div>
            <p className="expiry-note">This invite link will expire in 24 hours</p>
          </div>
        </div>
      )}
    </div>
  );
} 
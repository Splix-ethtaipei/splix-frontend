import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatAddress } from '../utils/formatters';
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
  members: { name: string; address: string }[];
}

// Add mock data
const mockResultData: ResultData = {
  id: 1,
  name: "Queenie's Foodie Group",
  owner: "bcd",
  items: [
    {
      id: 1,
      name: "Chicken Caesar Salad",
      price: 1699, // $16.99
      haspaid: true,
      payer: "Jeff"
    },
    {
      id: 2,
      name: "Classic Cheeseburger & Fries",
      price: 1899, // $18.99
      haspaid: false,
      payer: ""
    },
    {
      id: 3,
      name: "Margherita Pizza",
      price: 1999, // $19.99
      haspaid: false,
      payer: ""
    },
    {
      id: 4,
      name: "Fish & Chips",
      price: 2199, // $21.99
      haspaid: false,
      payer: ""
    }
  ],
  members: [
    { name: "Chee", address: "0xfA6cF974baf5F5589afF6364180D54fd0b2428F2" },
    { name: "Lucy", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
    { name: "Jeff", address: "0x123f681646d4a755815f9cb19e1acc8565a0c2ac" },
    { name: "Daisy", address: "0x9e8f732b20c4a12187895b11c992ec86e1b5be8d" }
  ]
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { id, chainid } = useParams();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [localData, setLocalData] = useState<ResultData | null>(null);
  const { address } = useAppKitAccount();
  const [newMember, setNewMember] = useState('');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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
      if (!resultData.members.some(m => m.address === trimmedMember)) {
        // // Actual API call would go here
        // await updateMembers([...resultData.members, trimmedMember]);

        setResultData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            members: [...prev.members, { name: trimmedMember, address: trimmedMember }]
          };
        });
      }
      setNewMember('');
    }
  };

  const handleRemoveMember = (memberToRemove: string) => {
    if (!resultData) return;

    const updatedMembers = resultData.members.filter(member => member.address !== memberToRemove);
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
    if (!localData) return;

    try {
      setError(null);

      // Call API to update group data
      await mockUpdateItem({ id: String(localData.id), items: localData.items });
      setResultData(localData);

      console.log('Changes submitted successfully!');
    } catch (error) {
      console.error('Error submitting changes:', error);
      setError('Failed to submit changes. Please try again.');
    }
  };

  const handleProceedToPayment = () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to pay for');
      return;
    }
    
    // Calculate total price for selected items
    const totalAmount = selectedItems.reduce((total, itemIndex) => {
      if (localData?.items[itemIndex]) {
        return total + localData.items[itemIndex].price;
      }
      return total;
    }, 0);
    
    // Create the payload to send to PayPage
    const paymentData = {
      groupId: localData?.id || 0,
      itemIds: selectedItems,
      amount: totalAmount,
      groupName: localData?.name || ''
    };
    
    // Navigate to payment page with data
    navigate(`/pay`, { state: { paymentData } });
  };

  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="pages">
        <div className="header">
          <img 
            src="/splix-logo.jpg" 
            alt="SpliX" 
            className="splix-logo"
            onError={(e) => {
              e.currentTarget.src = '../src/assets/splix-logo.svg';
            }}
          />
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
          <img 
            src="/splix-logo.jpg" 
            alt="SpliX" 
            className="splix-logo"
            onError={(e) => {
              e.currentTarget.src = '../src/assets/splix-logo.svg';
            }}
          />
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
        <img 
          src="/splix-logo.jpg" 
          alt="SpliX" 
          className="splix-logo"
          onError={(e) => {
            e.currentTarget.src = '../src/assets/splix-logo.svg';
          }}
        />
        <button
          className="nav-button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>

      <div className="result-content">
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
                {resultData.members.map((member, index) => {
                  const emojis = ["👨🏻", "👩🏻", "👨🏼", "👩🏼", "👨🏽", "👩🏽", "👨🏾", "👩🏾", "👨🏿", "👩🏿"];
                  const emoji = emojis[index % emojis.length];
                  
                  return (
                    <li key={index} className="member-item">
                      <div className="member-profile">
                        <div className="member-identity">
                          <span className="member-avatar">{emoji}</span>
                          <span className="member-name">{member.name}</span>
                        </div>
                        <span className="member-address">{formatAddress(member.address)}</span>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(member.address)}
                          className="remove-button"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  );
                })}
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
                        value={(item.price / 1000000).toFixed(2)}
                        onChange={(e) => handleEditItem(index, 'price', Math.round(Number(e.target.value) * 1000000))}
                        placeholder="Price"
                        step="0.01"
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={item.haspaid}
                          onChange={(e) => handleEditItem(index, 'haspaid', e.target.checked)}
                          className="item-checkbox"
                          disabled={false}
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
                      <div className="item-info">
                        <span className={resultData?.items[index].haspaid ? 'paid-item' : ''}>
                          <input
                            type="checkbox"
                            className="item-select-checkbox"
                            checked={selectedItems.includes(index)}
                            onChange={() => toggleItemSelection(index)}
                            disabled={resultData?.items[index].haspaid}
                          />
                          <strong>{item.name}</strong> - ${(item.price / 1000000).toFixed(2)}
                          {resultData?.items[index].haspaid && (
                            <span className="payer-info">
                              {' '}(Paid by {formatAddress(item.payer)})
                            </span>
                          )}
                        </span>
                      </div>
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

            <div className="payment-actions">
              <button
                className="payment-button"
                onClick={handleProceedToPayment}
                disabled={selectedItems.length === 0}
              >
                Pay Selected Items
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
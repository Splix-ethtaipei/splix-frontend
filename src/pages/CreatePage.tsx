import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKitAccount } from '@reown/appkit/react';
import './CreatePage.css';

interface Item {
  name: string;
  quantity: number;
  priceInNativeCurrency: number;
  nativeCurrency: string;
  priceInUsd: number;
}

interface FormData {
  title: string;
  members: string[];
  items: Item[];
}

export default function CreatePage() {
  const navigate = useNavigate();
  const { isConnected } = useAppKitAccount();
  const [currentMember, setCurrentMember] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    members: [],  // Start with empty members array
    items: []
  });
  const [isScanning, setIsScanning] = useState(false);

  // Redirect to home if not connected
  React.useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // // Make API call to create endpoint
      // const response = await fetch('/api/create', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to create item');
      // }

      // const result = await response.json();

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResult = {
        id: '123',
        ...formData,
        createdAt: new Date().toISOString()
      };

      // Navigate to main page
      navigate('/');
    } catch (error) {
      console.error('Error creating item:', error);
      // Handle error - you might want to show an error message to the user
    }
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentMember.trim()) {
      e.preventDefault(); // Prevent form submission
      // Add member to the list if it's not already included
      if (!formData.members.includes(currentMember.trim())) {
        setFormData(prev => ({
          ...prev,
          members: [...prev.members, currentMember.trim()]
        }));
      }
      setCurrentMember(''); // Clear the input
    }
  };

  const removeMember = (memberToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member => member !== memberToRemove)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsScanning(true);

    try {
      // Mock API response with new format
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const mockResponse = {
        item: "FoodA",
        quantity: 1,
        priceInNativeCurrency: 5.00,
        nativeCurrency: "USD",
        priceInUsd: 5.00
      };
      
      // Convert the response to our item format
      const newItem = {
        name: mockResponse.item,
        quantity: mockResponse.quantity,
        priceInNativeCurrency: mockResponse.priceInNativeCurrency,
        nativeCurrency: mockResponse.nativeCurrency,
        priceInUsd: mockResponse.priceInUsd
      };

      setFormData(prev => ({
        ...prev,
        items: [newItem]  // Replace existing items with new item
      }));

    } catch (error) {
      console.error('Error scanning item:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="pages">
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        <button 
          className="nav-button"
          onClick={() => navigate('/')}
        >
          Back
        </button>
      </div>
      
      <div className="create-content">
        <h1>Create New Item</h1>
        
        <form onSubmit={handleSubmit} className="create-form">
          {/* Title Section */}
          <div className="form-section">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                title: e.target.value
              }))}
              required
            />
          </div>

          {/* Members Section */}
          <div className="form-section">
            <label>Members:</label>
            <input
              type="text"
              value={currentMember}
              onChange={(e) => setCurrentMember(e.target.value)}
              onKeyDown={handleMemberKeyDown}
              placeholder="Enter member address and press Enter (optional)"
            />
            {formData.members.length > 0 && (
              <div className="members-list">
                {formData.members.map((member, index) => (
                  <div key={index} className="member-tag">
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(member)}
                      className="remove-member"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="form-section">
            <label>Item:</label>
            <div className="scan-section">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="file-input"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="scan-button">
                {isScanning ? 'Scanning...' : 'Scan Item'}
              </label>
            </div>

            {formData.items.length > 0 && (
              <div className="item-inputs">
                <div className="input-group">
                  <label htmlFor="item-name">Item Name</label>
                  <input
                    id="item-name"
                    type="text"
                    value={formData.items[0].name}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        items: [{ ...prev.items[0], name: e.target.value }]
                      }));
                    }}
                    placeholder="Item name"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="item-quantity">Quantity</label>
                  <input
                    id="item-quantity"
                    type="number"
                    value={formData.items[0].quantity}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        items: [{ ...prev.items[0], quantity: parseInt(e.target.value) || 0 }]
                      }));
                    }}
                    placeholder="Quantity"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="item-native-price">Price in Native Currency</label>
                  <input
                    id="item-native-price"
                    type="number"
                    step="0.01"
                    value={formData.items[0].priceInNativeCurrency}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        items: [{ ...prev.items[0], priceInNativeCurrency: parseFloat(e.target.value) || 0 }]
                      }));
                    }}
                    placeholder="Price in native currency"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="item-currency">Native Currency</label>
                  <input
                    id="item-currency"
                    type="text"
                    value={formData.items[0].nativeCurrency}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        items: [{ ...prev.items[0], nativeCurrency: e.target.value }]
                      }));
                    }}
                    placeholder="e.g., USD"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="item-usd-price">Price in USD</label>
                  <input
                    id="item-usd-price"
                    type="number"
                    step="0.01"
                    value={formData.items[0].priceInUsd}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        items: [{ ...prev.items[0], priceInUsd: parseFloat(e.target.value) || 0 }]
                      }));
                    }}
                    placeholder="Price in USD"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={formData.items.length === 0}
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
} 
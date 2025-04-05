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

interface ScanResultItem {
  name: string;
  quantity: number;
  price: number;
  currency: string;
  price_usd: number;
}

interface ScanResult {
  restaurant_name: string | null;
  location: string | null;
  phone_number: string | null;
  date: string;
  time: string;
  items: ScanResultItem[];
  tax: number | null;
  total: number;
  currency: string;
  total_usd: number;
  currency_usd: string;
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
  const baseUrl = import.meta.env.VITE_API_ENDPOINT;
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

    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(file);
    const base64Data = await base64Promise;

    try {
      // Create form data for file upload
      // const formData = new FormData();
      // formData.append('image', file);

      // Make API call to scan endpoint
      const url = `${baseUrl}/scan-receipt`;
      console.log(url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan item');
      }

      const scanResult: ScanResult = await response.json();

      // Convert the response to our item format
      // const newItem = {
      //   name: scanResult.item,
      //   quantity: scanResult.quantity,
      //   priceInNativeCurrency: scanResult.priceInNativeCurrency,
      //   nativeCurrency: scanResult.nativeCurrency,
      //   priceInUsd: scanResult.priceInUsd
      // };
      const newItems = scanResult.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        priceInNativeCurrency: item.price,
        nativeCurrency: item.currency,
        priceInUsd: item.price_usd
      }));

      setFormData(prev => ({
        ...prev,
        items: newItems  // Replace existing items with new item
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
              <div className="items-list">
                {formData.items.map((item, index) => (
                  <div key={index} className="item-inputs">
                    <div className="item-header">
                      <h3>Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== index)
                          }));
                        }}
                        className="remove-item"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="input-group">
                      <label htmlFor={`item-name-${index}`}>Item Name</label>
                      <input
                        id={`item-name-${index}`}
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((i, idx) =>
                              idx === index ? { ...i, name: e.target.value } : i
                            )
                          }));
                        }}
                        placeholder="Item name"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor={`item-quantity-${index}`}>Quantity</label>
                      <input
                        id={`item-quantity-${index}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((i, idx) =>
                              idx === index ? { ...i, quantity: parseInt(e.target.value) || 0 } : i
                            )
                          }));
                        }}
                        placeholder="Quantity"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor={`item-native-price-${index}`}>Price in Native Currency</label>
                      <input
                        id={`item-native-price-${index}`}
                        type="number"
                        step="0.01"
                        value={item.priceInNativeCurrency}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((i, idx) =>
                              idx === index ? { ...i, priceInNativeCurrency: parseFloat(e.target.value) || 0 } : i
                            )
                          }));
                        }}
                        placeholder="Price in native currency"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor={`item-currency-${index}`}>Native Currency</label>
                      <input
                        id={`item-currency-${index}`}
                        type="text"
                        value={item.nativeCurrency}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((i, idx) =>
                              idx === index ? { ...i, nativeCurrency: e.target.value } : i
                            )
                          }));
                        }}
                        placeholder="e.g., USD"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor={`item-usd-price-${index}`}>Price in USD</label>
                      <input
                        id={`item-usd-price-${index}`}
                        type="number"
                        step="0.01"
                        value={item.priceInUsd}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((i, idx) =>
                              idx === index ? { ...i, priceInUsd: parseFloat(e.target.value) || 0 } : i
                            )
                          }));
                        }}
                        placeholder="Price in USD"
                        required
                      />
                    </div>
                  </div>
                ))}
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
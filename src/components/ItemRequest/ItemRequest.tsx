import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ItemRequest.css';

interface ItemRequestProps {
  groupid: number;
  name: string;
  owner: string;
  itemcount: number;
  account: string;
  chainid: number;
}

const ItemRequest: React.FC<ItemRequestProps> = ({ groupid, name, owner, itemcount, account, chainid }) => {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_ENDPOINT || '';

  const handleAccept = async () => {
    try {
      // Make API call to accept request
      await fetch(`${baseUrl}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupid,
          user: account,
          chainId: chainid
        })
      });

      // Navigate to result page after successful acceptance
      navigate(`/result/${groupid}`);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async () => {
    try {
      // Make API call to reject request
      await fetch(`${baseUrl}/groups/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupid,
          user: account,
          chainId: chainid
        })
      });

      // Refresh the list or handle UI update
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <li className="request-item">
      <div className="request-info">
        <h3 className="request-title">{name}</h3>
        <p className="request-creator">Created by: {owner}</p>
        <p className="request-count">Items: {itemcount}</p>
      </div>
      <div className="request-actions">
        <button
          className="accept-button"
          onClick={handleAccept}
        >
          Accept
        </button>
        <button
          className="reject-button"
          onClick={handleReject}
        >
          Reject
        </button>
      </div>
    </li>
  );
};

export default ItemRequest; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatAddress } from '../../utils/formatters';
import './Item.css';

interface ItemProps {
  groupid: number;
  chainid: number;
  name: string;
  itemcount: number;
  owner: string;
  account?: string; // Made optional since it's not used in this component
}

const Item: React.FC<ItemProps> = ({ groupid, name, itemcount, owner, chainid }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/result/${groupid}/${chainid}`);
  };

  return (
    <div className="group-item" onClick={handleClick}>
      <div className="group-title">{name}</div>
      <div className="group-details">
        <div>Items: {itemcount}</div>
        <div>Created by: {formatAddress(owner)}</div>
      </div>
    </div>
  );
};

export default Item; 
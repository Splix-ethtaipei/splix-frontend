import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Item.css';

interface ItemProps {
  groupid: number;
  chainid: number;
  name: string;
  itemcount: number;
  owner: string;
  account: string;
}

const Item: React.FC<ItemProps> = ({ groupid, name, itemcount, owner, account, chainid }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/result/${groupid}/${chainid}`);
  };

  return (
    <div className="group-item" onClick={handleClick}>
      <div className="group-title">{name}</div>
      <div className="group-details">
        <div>Items: {itemcount}</div>
        <div>Created by: {owner}</div>
      </div>
    </div>
  );
};

export default Item; 
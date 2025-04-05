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
    <li className="item" onClick={handleClick} role="button" tabIndex={0}>
      <div>{name}</div>
      <div>Created by: {owner}</div>
      <div>Items: {itemcount}</div>
    </li>
  );
};

export default Item; 
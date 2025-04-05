import React, { useState, useEffect } from 'react';
import './ItemList.css';
import ItemType from '../Item/Item';

interface ItemType {
  groupid: number;
  chainid: number;
  name: string;
  itemcount: number;
  owner: string;
  account: string;
}
interface ItemListProps {
  account: string;
  apiEndpoint: string;
  ItemComponent: React.ComponentType<ItemType>;
}

const ItemList: React.FC<ItemListProps> = ({ account, apiEndpoint, ItemComponent }) => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockData: ItemType[] = [
      { groupid: 1, chainid: 1, name: 'Mock Item 1', itemcount: 1, owner: 'mock', account: account },
      { groupid: 2, chainid: 1, name: 'Mock Item 2', itemcount: 2, owner: 'mock', account: account },
    ];

    const fetchItems = async () => {
      try {
        if (!apiEndpoint) {
          setItems(mockData);
          return;
        }

        const response = await fetch(`${apiEndpoint}/${account}`);
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data.map((item: ItemType) => ({ ...item, account, chainid: item.chainid })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [account, apiEndpoint]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!items || items.length === 0) return <div>No items found</div>;

  return (
    <ul className="item-list">
      {items.map((item) => (
        <ItemComponent
          key={item.groupid}
          {...item}
        />
      ))}
    </ul>
  );
};

export default ItemList; 
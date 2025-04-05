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

const mockItems: ItemType[] = [
  {
    groupid: 1001,
    chainid: 1,
    name: "Queenie's Foodie Group",
    itemcount: 5,
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    groupid: 1002,
    chainid: 1,
    name: "Chee's Birthday Party",
    itemcount: 1,
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    groupid: 1003,
    chainid: 137,
    name: "EthTaipei Gang",
    itemcount: 2,
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    account: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  {
    groupid: 1004,
    chainid: 137,
    name: "Karaoke Degens",
    itemcount: 10,
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    account: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
];

const ItemList: React.FC<ItemListProps> = ({ account, apiEndpoint, ItemComponent }) => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_API_ENDPOINT || '';

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('apiEndpoint', apiEndpoint);
        // If no API endpoint is provided or it's an empty string, use mock data
        if (!baseUrl) {
          console.log('No API endpoint provided, using mock data');
          setItems(mockItems);
          return;
        }

        const response = await fetch(`${apiEndpoint}/${account}`);

        // Check content-type header
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          console.warn(`Received non-JSON response (${contentType}), falling back to mock data`);
          setItems(mockItems.filter(item => item.account === account));
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setItems(data.map((item: ItemType) => ({ ...item, account, chainid: item.chainid })));
      } catch (err) {
        console.error('Error fetching items:', err);
        // Fallback to mock data on error
        setItems(mockItems.filter(item => item.account === account));
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
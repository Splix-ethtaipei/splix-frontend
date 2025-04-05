interface UpdateItemRequest {
  id: string;
  items: {
    id: number;
    name: string;
    price: number;
    haspaid: boolean;
    payer: string;
  }[];
}

// Real API implementation
export const updateItem = async (data: UpdateItemRequest): Promise<void> => {
  try {
    const response = await fetch(`/api/items/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update item');
    }
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Mock implementation
export const mockUpdateItem = async (data: UpdateItemRequest): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Mock update successful:', data);
}; 
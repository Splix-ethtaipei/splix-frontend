interface InviteResponse {
  inviteCode: string;
  expiresAt: string;
}

// Real API implementation
export const generateInviteCode = async (itemId: string): Promise<InviteResponse> => {
  try {
    const response = await fetch(`/api/items/${itemId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate invite code');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating invite code:', error);
    throw error;
  }
};

// Mock implementation
export const mockGenerateInviteCode = async (itemId: string): Promise<InviteResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    inviteCode: `INVITE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
}; 
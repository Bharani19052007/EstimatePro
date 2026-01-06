// This is a temporary utility to help with development
// In a production app, this would be replaced with actual authentication

export const mockLogin = () => {
  const mockUser = {
    id: '65b4f8a5c9b4a80015d4e3b1',
    name: 'Test User',
    email: 'test@example.com',
    token: 'mock-jwt-token-for-testing'
  };
  
  localStorage.setItem('user', JSON.stringify(mockUser));
  localStorage.setItem('token', mockUser.token);
  
  return mockUser;
};

export const isMockUserLoggedIn = () => {
  return !!localStorage.getItem('token');
};

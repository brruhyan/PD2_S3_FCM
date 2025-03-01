// contexts/UserContext.js
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [username, setUsername] = useState('User'); // Default username
  const [userEmail, setUserEmail] = useState(''); // Default email is empty string

  return (
    <UserContext.Provider value={{ 
      username, 
      setUsername,
      userEmail,
      setUserEmail 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
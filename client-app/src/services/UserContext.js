import React, { createContext, useContext, useState } from 'react';

// Create a Context for user data
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
    return useContext(UserContext);
};

// Provider to wrap your components and provide user data
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const value = { user, setUser };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

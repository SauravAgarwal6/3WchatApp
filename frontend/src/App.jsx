import React, { useState } from 'react';
import Auth from './components/Auth';
import ChatBoard from './components/ChatBoard';

export default function App() {
  const [activeUser, setActiveUser] = useState(null);

  return (
    <>
      {!activeUser ? (
        <Auth onLogin={(username) => setActiveUser(username)} />
      ) : (
        <ChatBoard 
          username={activeUser} 
          onLogout={() => setActiveUser(null)} 
        />
      )}
    </>
  );
}
import React from 'react';
import AppProvider from './Provider';
import Chatroom from './components/Chatroom';
import './App.css';


export default function App() {
  return (
    <AppProvider>
      <div className="App">
        <Chatroom />
      </div>
    </AppProvider>
  );
};

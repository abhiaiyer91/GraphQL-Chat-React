import React from 'react';
import { ApolloProvider } from 'react-apollo';
import client from './client';

export default function AppProvider({ children }) {
  return (
    <ApolloProvider client={client}>
      <div>
        {children}
      </div>
    </ApolloProvider>
  );
}

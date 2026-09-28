import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import App from './App';

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:3001/graphql' }),
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
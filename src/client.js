import ApolloClient, { createNetworkInterface } from 'apollo-client';

export default new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: 'http://localhost:4010/graphql',
  }),
  connectToDevTools: true,
});

import { WebSocketLink } from "apollo-link-ws";
import { getToken } from "./token-refresher";
import ApolloClient from "apollo-client/ApolloClient";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApiTokenInfo } from "./models";

const API_KEY = "web_24415c0a0b108b4096a8640234aa5303";

/**
 * wsLink: websocket link that will be used by apollo
 * the connection is async as it may require a token refresh
**/
const wsLink = new WebSocketLink({
  uri: "wss://mainnet.eos.dfuse.io/graphql",
  options: {
    lazy: true,
    reconnect: true,
    connectionParams: async () => {
      const apiToken: ApiTokenInfo | undefined = await getToken(API_KEY);
      if (apiToken) {
        return {
          Authorization: `Bearer ${apiToken.token}`
        };
      }
      throw new Error("can't get token");
    }
  }
});

export const apolloClient = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache()
});

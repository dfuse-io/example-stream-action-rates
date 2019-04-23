import { gql } from "apollo-boost";

import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { WebSocketLink } from "apollo-link-ws";
import { getToken } from "./token-refresher";

export const subscribeTransactions = gql`
  fragment actionTracesFragment on ActionTrace {
    account
    receiver
    name
  }
  subscription subscribeTransactions($cursor: String, $lowBlockNum: Int64) {
    searchTransactionsForward(
      query: "status:executed notif:false"
      lowBlockNum: $lowBlockNum
      cursor: $cursor
    ) {
      cursor
      trace {
        status
        block {
          id
          num
          timestamp
        }
        id
        executedActions {
          ...actionTracesFragment
        }
      }
    }
  }
`;

const WS_URL = "wss://mainnet.eos.dfuse.io/graphql";
const API_KEY = "web_24415c0a0b108b4096a8640234aa5303";

const wsLink = new WebSocketLink({
  uri: WS_URL,
  options: {
    lazy: true,
    reconnect: true,
    connectionParams: async () => {
      const apiToken: any | undefined = await getToken(API_KEY);
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

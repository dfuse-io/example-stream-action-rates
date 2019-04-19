import { gql } from "apollo-boost";

import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { WebSocketLink } from "apollo-link-ws";
import { getToken } from "./token-refresher";
import { GQLTransactionFragments } from "./graphql-fragments";

export const subscribeTransactions = gql`
  ${GQLTransactionFragments.actionTrace}
  subscription subscribeTransactions($cursor: String, $lowBlockNum: Int64) {
    searchTransactionsForward(
      query: "status:executed"
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
const API_KEY = "web_6d99c117406c10f6fd9ee25c7d6f7323";

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

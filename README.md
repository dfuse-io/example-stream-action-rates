# Get started with dfuse.io GraphQL API using REACT

# Stream action rates example

This example demonstrates how to use the dfuse API in a React application to livestream the average rates from the top actions.   

### Token managment
First, head on to our self-service API management portal (https://app.dfuse.io), after signing up you will be able to create long-term API keys.

Once you have this API key, call the https://auth.dfuse.io/v1/auth/issue endpoint to get a fresh Authentication Token (JWT). 

```typescript

/** getTokenFromServer: fetch new token from backend using the dfuse api key **/
async function getTokenFromServer(apiKey: string): Promise<ApiTokenInfo> {
  const jsonBody = JSON.stringify({ api_key: apiKey })

  return fetch("https://auth.dfuse.io/v1/auth/issue", {  method: "POST", body: jsonBody })
    .then(async (response: Response) => {
      const tokenInfo = await response.json()
      ApiTokenLocalStorage.set(tokenInfo)
      return Promise.resolve(tokenInfo)
    })
}
const API_KEY= "<Your-api-key>"

getTokenFromServer(API_KEY).then((token: ApiTokenInfo) => {
   console.log(token)
})
```

### When to refresh your JWT token
Tokens have a life span of 24h (that can vary) and need to be refreshed before they expire. Please see [Lifecycle of short-lived JWTs](https://docs.dfuse.io/#authentication)

https://auth.dfuse.io/v1/auth/issue endpoint is rated limited. Full documentation can be found here [API key types & Rate limiting](https://docs.dfuse.io/#authentication)

```typescript

/**
 * parseJwt: Extracts JSON data from the JWT token
**/
function parseJwt(token: string) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

/**
 * getToken: handles the token refresh,
 * only when it is expired, else use the token in local storage
**/
export async function getToken(apiKey: string): Promise<ApiTokenInfo> {
  const tokenInfo: ApiTokenInfo | undefined = ApiTokenLocalStorage.get()

  if(!tokenInfo) {
    return await getTokenFromServer(apiKey)
  }

  const jwt = parseJwt(tokenInfo.token);
  const expiration = jwt["exp"];
  const now = Date.now() / 1000;

  const remainingTime = expiration - now;

  console.log("Time remaining in second: " + remainingTime);
  if (remainingTime < 60 * 60) {
    return await getTokenFromServer(apiKey)
  }

  return tokenInfo
}
```

### Initializing the graphql client (apollo)

We use the [apollo client](https://www.apollographql.com/docs/react/) to connect to the graphQL server. You can install the apollo client and other required packages via:

```
yarn add apollo-boost graphql apollo-client apollo-link-ws react-apollo subscriptions-transport-ws
```

In our example, we instantiate the apollo client like follows:


```typescript

import { WebSocketLink } from "apollo-link-ws";
import { getToken } from "./token-refresher";
import ApolloClient from "apollo-client/ApolloClient";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApiTokenInfo } from "./models";

const API_KEY = "<your-api-key>";

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
```

### GraphQL query
- dfuse GraphQL documention can be found [here](https://docs.dfuse.io/#graphql)
- If you are not familiar with GraphQL. Take a look at [Introduction to GraphQL](https://graphql.org/learn/) 
- To help you construct your query and access our api documentation you can use [GraphiQL](https://mainnet.eos.dfuse.io/graphiql/) _"A graphical interactive in-browser GraphQL IDE."_ 
https://mainnet.eos.dfuse.io/graphiql/

### Build the graphQL subscription

We use the [gql](https://www.apollographql.com/docs/react/essentials/queries) function to build our subscription query:

```typescript
import { gql } from "apollo-boost";

/**
* subscribeTransactions:
* Subscription query to connect to the transaction stream
* $cursor: pagination cursor, can be saved to be reused in case of disconnection
* $lowBlockNum: starting block num, a negative number means fetching the past N blocks
**/
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
```

### Use in react application

Apollo provides an `ApolloProvider` component to link the apollo client to the React application. Using the subscription query is as simple as passing it to the `Subscription` component (read [apollo doc](https://www.apollographql.com/docs/react/advanced/subscriptions) for more details)


```typescript
class App extends Component {
  
  ...
 
  onSubscriptionData = ({ client, subscriptionData }: any) => {
    const response = subscriptionData.data.searchTransactionsForward;
    console.log(response)
  };
  
  render() {
    return <ApolloProvider client={apolloClient}>
      <Subscription
        subscription={subscribeTransactions}
        variables={{ cursor: "", lowBlockNum: -100 }}
        onSubscriptionData={this.onSubscriptionData}
      />
    </ApolloProvider>
    
  }
}

```

### Parsing server response

The response from the server is parsed and fed into an `actionsMap` hash to hold the rates for each action contract/name pair

```typescript
/**
** interfaces representing the output from graphql
**/
export interface GraphQLTransactionTrace {
  block: {
    id: string;
    num: number;
    timestamp: string;
  };
  executedActions: GraphQLActionTrace[];
  id: string;
  status: string;
}

export interface GraphQLActionTrace {
  account: string;
  data: any;
  name: string;
  receiver: string;
}

/**
* ActionMap:
* format "<action-acccount>:<action-name>": count
* used to render stats in the react application
**/
export interface ActionMap {
 [key:string]: number
}

/**
 * parseResponseFromGraphQL:
 * parses the transaction trace from the backend and fills an actionsMap bucket with it
 * returns the actionsMap
 * the 'undo' property relates to the block irreversibility and controls the incrementation
 **/
export function parseResponseFromGraphQL(
  actionsMap: ActionMap,
  data: GraphQLTransactionTrace,
  undo: boolean
) {
  data.executedActions.map((action: GraphQLActionTrace) => {
    const key = `${action.account}:${action.name}`;
    const increment = undo ? -1 : 1;
    if (!actionsMap[key]) {
      actionsMap[key] = increment;
    } else {
      actionsMap[key] += increment;
    }
  });
  return actionsMap;
}
```

The snippet above contains an `undo` parameter (returned inside the payload of the subscription response), that parameter handles `forks` inside the chain and the counter is decremented if it is set to `true`. Please refer to the full example to see how the output of `parseResponseFromGraphQL` is used inside the view.


# Quick start to run the example

The following assumes you have yarn installed on your computer

- Clone this repository
- yarn install
- yarn start
- open `localhost:3000` in a new tab in your webbrowser

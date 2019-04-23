
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
* ApiTokenInfo: token payload returned by the token issuer
**/
export interface ApiTokenInfo {
  token: string
  expires_at: number
}

/**
* ActionMap:
* format "<action-acccount>:<action-name>": count
* used to render stats in the react application
**/
export interface ActionMap {
 [key:string]: number
}
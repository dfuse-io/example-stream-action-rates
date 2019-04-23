import {
  ActionMap,
  GraphQLActionTrace,
  GraphQLTransactionTrace
} from "./models";

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

/**
 * sortActions:
 * sorts the action counts in descending order
**/
export function sortActions(actionsMap: ActionMap) {
  return Object.keys(actionsMap).sort(function(a, b) {
    return actionsMap[b] - actionsMap[a];
  });
}

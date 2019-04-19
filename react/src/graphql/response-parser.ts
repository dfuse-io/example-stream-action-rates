export function parseResponseFromGraphQL(actionsMap: { [key:string]: number}  ,data: GraphQLTransactionTrace, undo: boolean) {

  console.log(data.block.timestamp)
  data.executedActions.map((action: GraphQLActionTrace) => {
    const key = `${action.account}:${action.name}`
    const increment = undo ? -1 : 1
    if(!actionsMap[key]){
      actionsMap[key] = increment
    } else {
      actionsMap[key] += increment
    }
  })
  return actionsMap
}

export function sortActions(actionsMap: { [key:string]: number} ){
  let sorted = Object.keys(actionsMap).sort(
    function(a,b) {
      // compares (the keys) by their respective values.
      return actionsMap[b] - actionsMap[a];
    })
  return sorted
}

interface GraphQLTransactionTrace {
  block: {
    id: string;
    num: number;

    timestamp: string;
  };
  executedActions: GraphQLActionTrace[];
  id: string;
  status: string;
}

interface GraphQLActionTrace {
  account: string;
  data: any;
  name: string;
  receipt: {
    receiver: string;
  };
}



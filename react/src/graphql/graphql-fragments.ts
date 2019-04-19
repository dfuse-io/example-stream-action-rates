import { gql } from "apollo-boost"

export const GQLTransactionFragments = {
  actionTrace: gql`
    fragment actionTracesFragment on ActionTrace {
      account
      name
      data
      receipt {
        receiver
      }
    }
  `
}




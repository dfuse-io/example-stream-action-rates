import React, { Component } from "react";
import "./App.css";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import { red } from "@material-ui/core/colors";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

import styled from "@emotion/styled";
import { display, height, space, width } from "styled-system";
import Table from "@material-ui/core/Table/Table";
import TableHead from "@material-ui/core/TableHead/TableHead";
import TableRow from "@material-ui/core/TableRow/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableBody from "@material-ui/core/TableBody/TableBody";
import Subscription from "react-apollo/Subscriptions";
import { apolloClient, subscribeTransactions } from "./graphql/graphql-query";
import ApolloProvider from "react-apollo/ApolloProvider";
import {
  parseResponseFromGraphQL,
  sortActions
} from "./graphql/response-parser";
import Grid from "@material-ui/core/Grid/Grid";
import Card from "@material-ui/core/Card/Card";
import Paper from "@material-ui/core/Paper/Paper";

const theme = createMuiTheme({
  palette: {
    primary: red
  }
});

const Cell: React.ComponentType<any> = styled.div`
  ${space};
  ${width};
  ${height};
  ${display};
`;

class App extends Component<any, { topActions: string[] }> {
  actionsMap: { [key: string]: number } = {};
  interval: any = undefined;
  state = { topActions: [] };
  startTime = Date.now();
  componentDidMount(): void {
    this.interval = setInterval(() => {
      const topActions = sortActions(this.actionsMap);
      this.setState({ topActions: topActions.slice(0, 50) });
    }, 1000);
  }

  renderActions(): JSX.Element[] {
    let timeRange = (Date.now() - this.startTime) / (60 * 1000);
    if (timeRange === 0) {
      timeRange = 1;
    }
    return this.state.topActions.map((topAction: string, index: number) => {
      return (
        <TableRow key={index}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{topAction.split(":")[0]}</TableCell>
          <TableCell>{topAction.split(":")[1]}</TableCell>
          <TableCell>
            {Math.floor(this.actionsMap[topAction] / timeRange)}
          </TableCell>
        </TableRow>
      );
    });
  }

  onSubscriptionData = ({ client, subscriptionData }: any) => {
    const response = subscriptionData.data.searchTransactionsForward;
    this.actionsMap = parseResponseFromGraphQL(
      this.actionsMap,
      response.trace,
      response.undo
    );
  };

  render() {
    const cursor = "";
    const lowBlockNum = -1;
    return (
      <div className="App">
        <ApolloProvider client={apolloClient}>
          <MuiThemeProvider theme={theme}>
            <Subscription
              subscription={subscribeTransactions}
              variables={{ cursor, lowBlockNum }}
              onSubscriptionData={this.onSubscriptionData}
            />
            <Card>
              <Grid xs={10}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Count per minute</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{this.renderActions()}</TableBody>
                </Table>
              </Grid>
            </Card>
          </MuiThemeProvider>
        </ApolloProvider>
      </div>
    );
  }
}

export default App;

import React, { Component } from "react";
import "./App.css";
import styled from "@emotion/styled";
import { display, height, space, width } from "styled-system";
import Table from "@material-ui/core/Table/Table";
import TableHead from "@material-ui/core/TableHead/TableHead";
import TableRow from "@material-ui/core/TableRow/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableBody from "@material-ui/core/TableBody/TableBody";
import Subscription from "react-apollo/Subscriptions";
import { subscribeTransactions } from "./lib/graphql-subscription";
import ApolloProvider from "react-apollo/ApolloProvider";
import { parseResponseFromGraphQL, sortActions } from "./lib/response-parser";
import Grid from "@material-ui/core/Grid/Grid";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Cell,
  ResponsiveContainer
} from "recharts";
import { apolloClient } from "./lib/apollo-client";
import { ActionMap } from "./lib/models";

const Container: React.ComponentType<any> = styled.div`
  ${space};
  ${width};
  ${height};
  ${display};
`;


/**
 * React application implementing the average action rates widget using
 * the apollo client and dfuse apis
 * the subscription is bootstrapped by the 'renderSubscriber' method
 * coupled with the ApolloProvider (see main 'render()' method)
 * the packages material-ui and recharts are used for the table render and charts respectively
**/
class App extends Component<any, { topActions: string[] }> {
  actionsMap: ActionMap = {};
  interval: any = undefined;
  state = { topActions: [] };
  startTime = 0;
  startTimeString = "";
  endTime = 0;

  /**
  * setInterval throttles the render refresh
  * to increase both performance and user experience
  **/
  componentDidMount(): void {
    this.interval = setInterval(() => {
      const topActions = sortActions(this.actionsMap);
      this.setState({ topActions: topActions.slice(0, 50) });
    }, 3500);
  }


  get timeRange() {
    let timeRange = (this.endTime - this.startTime) / (60 * 1000);
    if (timeRange === 0) {
      timeRange = 1;
    }
    return timeRange;
  }

  /** Parses the data from payload and updates the timerange **/
  onSubscriptionData = ({ client, subscriptionData }: any) => {
    const response = subscriptionData.data.searchTransactionsForward;
    if (this.startTime === 0) {
      this.startTime = new Date(response.trace.block.timestamp).getTime();
      this.startTimeString = response.trace.block.timestamp;
    }
    this.endTime = new Date(response.trace.block.timestamp).getTime();

    this.actionsMap = parseResponseFromGraphQL(
      this.actionsMap,
      response.trace,
      response.undo
    );


      let height = document.getElementsByClassName("App")[0].clientHeight
      window.parent.postMessage({"height": height}, "*")
  };

  /** RENDER Methods **/
  renderActions(): JSX.Element[] {
    return this.state.topActions.map((topAction: string, index: number) => {
      return (
        <TableRow key={index}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{topAction.split(":")[0]}</TableCell>
          <TableCell>{topAction.split(":")[1]}</TableCell>
          <TableCell>
            {Math.floor(this.actionsMap[topAction] / this.timeRange)}
          </TableCell>
        </TableRow>
      );
    });
  }

  renderLoading() {
    return <p>Loading...</p>;
  }

  renderSubscriber() {
    return <Subscription
      subscription={subscribeTransactions}
      variables={{ cursor: "", lowBlockNum: -100 }}
      onSubscriptionData={this.onSubscriptionData}
    />
  }

  renderWidgets() {
    const data = this.state.topActions.slice(0, 10).map((topAction: string) => {
      return {
        name: topAction.split(":")[0],
        value: Math.floor(this.actionsMap[topAction] / this.timeRange)
      };
    });

    return [
      <div key="1" style={{ width: "100%", height: 300, paddingBottom: "50px" }}>
        <ResponsiveContainer>
          <BarChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis scale="log" domain={["auto", "auto"]} />
            <Bar dataKey="value" fill="#1c1e3e" label={{ position: "top" }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#1c1e3e" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>,
      <Container key="2">
        <Grid xs={12}>
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
      </Container>
    ];
  }

  render() {
    return (
      <div className="App">
        <ApolloProvider client={apolloClient}>
          {this.renderSubscriber()}
          <div>
            <h2 style={{ color: "#1c1e3e", paddingTop: "40px" }}>
              Average action rates since {this.startTimeString}
            </h2>
          </div>
          {this.state.topActions.length > 0
            ? this.renderWidgets()
            : this.renderLoading()}
        </ApolloProvider>
      </div>
    );
  }
}

export default App;

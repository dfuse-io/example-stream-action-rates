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
import { apolloClient, subscribeTransactions } from "./graphql/graphql-query";
import ApolloProvider from "react-apollo/ApolloProvider";
import {
  parseResponseFromGraphQL,
  sortActions
} from "./graphql/response-parser";
import Grid from "@material-ui/core/Grid/Grid";
import {BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell, ResponsiveContainer} from "recharts";

const Container: React.ComponentType<any> = styled.div`
  ${space};
  ${width};
  ${height};
  ${display};
  overflow-y: auto;
`;

class App extends Component<any, { topActions: string[] }> {
  actionsMap: { [key: string]: number } = {};
  interval: any = undefined;
  state = { topActions: [] };
  startTime = 0;
  startTimeString = "";
  endTime = 0;
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
    return timeRange
}

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

  onSubscriptionData = ({ client, subscriptionData }: any) => {
    const response = subscriptionData.data.searchTransactionsForward;
    if(this.startTime === 0) {
      this.startTime = new Date(response.trace.block.timestamp).getTime()
      this.startTimeString = response.trace.block.timestamp
    }
    this.endTime = new Date(response.trace.block.timestamp).getTime()

    this.actionsMap = parseResponseFromGraphQL(
      this.actionsMap,
      response.trace,
      response.undo
    );
  };

  renderLoading(){
    return <p>Loading...</p>
  }
  
  renderContent() {

    const data = this.state.topActions.slice(0, 10).map((topAction: string) => {
      return { name: topAction.split(":")[0], value: Math.floor(this.actionsMap[topAction] / this.timeRange) }
    })

    return [<div key="1" style={{width: "100%", height: 300}}>
            <ResponsiveContainer>
                <BarChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                      top: 20, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis scale="log" domain={['auto', 'auto']}/>
                    <Bar dataKey="value" fill="#1c1e3e" label={{position: 'top'}}>
                      {
                        data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#1c1e3e"/>
                        ))
                      }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>,
      <Container key="2" height="700px">
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
    </Container>]
  }

  render() {
    const cursor = "";
    const lowBlockNum = -120;

    return (
      <div className="App">
        <ApolloProvider client={apolloClient}>
          <Subscription
            subscription={subscribeTransactions}
            variables={{cursor, lowBlockNum}}
            onSubscriptionData={this.onSubscriptionData}
          />
          <div>
            <h2 style={{color: "#1c1e3e"}}>Average action rates since {this.startTimeString}</h2>
          </div>
          {this.state.topActions.length > 0 ? this.renderContent() : this.renderLoading()}
        </ApolloProvider>
      </div>
    );
  }
}

export default App;

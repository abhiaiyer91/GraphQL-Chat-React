import React from 'react';
import gql from 'graphql-tag';
import {get} from 'lodash';
import update from 'immutability-helper';
import {compose, mapProps, lifecycle} from 'recompose';
import {graphql} from 'react-apollo';
import MessageBox from './MessageBox';

const chatroom = gql`
  query chatRoom($id: Int!) {
    chatroom(id: $id) {
      messages {
        id
        text
      }
    }
  }
`;

const messageAdded = gql`
  subscription onMessageAdded($chatroomId: Int!){
    messageAdded(chatroomId: $chatroomId){
      id
      text
    }
  }
`;

function ChatMessages({closeMessages, ready, title, id, messages}) {
  return (
    <section>
      <h1 className="title">{title}</h1>
      {ready
        ? messages.map(message => {
            return (
              <div key={message.id} className="message">
                <p>{message.text}</p>
              </div>
            );
          })
        : null}
      <MessageBox id={id} closeMessages={closeMessages} />
    </section>
  );
}

export default compose(
  graphql(chatroom, {
    options: ({id}) => {
      return {
        variables: {
          id,
        },
      };
    },
  }),
  mapProps(({data, id, ...rest}) => {
    const subscribeToMore = data && data.subscribeToMore;
    const messages = data && data.chatroom && data.chatroom.messages;
    return {
      id,
      ready: !data.loading,
      messages,
      subscribeToMessages: (): void => {
        return subscribeToMore({
          document: messageAdded,
          variables: {
            chatroomId: id,
          },
          onError: (e: Object): void => {
            return console.error('APOLLO-CHAT', e);
          },
          updateQuery: (
            previousResult: Object,
            {subscriptionData}: Object
          ): Object => {
            if (!subscriptionData.data) {
              return previousResult;
            }

            const messageToAdd = get(subscriptionData, 'data.messageAdded');

            const newResult = update(previousResult, {
              chatroom: {
                messages: {
                  $push: [messageToAdd],
                },
              },
            });
            return newResult;
          },
        });
      },
      ...rest,
    };
  }),
  lifecycle({
    componentWillMount() {
      const { subscribeToMessages } = this.props;
      return subscribeToMessages();
    },
  })
)(ChatMessages);

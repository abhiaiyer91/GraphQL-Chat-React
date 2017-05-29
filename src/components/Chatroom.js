import React from 'react';
import gql from 'graphql-tag';
import {get} from 'lodash';
import {compose, withHandlers, withState, mapProps, lifecycle} from 'recompose';
import {graphql} from 'react-apollo';

const chatrooms = gql`
{
  chatrooms {
    id
    title
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

let SendMessageButton = function SendMessageButton({sendMessage}) {
  return <button onClick={sendMessage}>Send Message</button>;
};

const addMessage = gql`
  mutation add($text: String!, $userId: Int!, $chatroomId: Int!) {
    addMessage(text: $text, userId: $userId, chatroomId: $chatroomId) {
      text
    }
  }
`;

SendMessageButton = compose(
  graphql(addMessage),
  withHandlers({
    sendMessage: ({setMessage, message, mutate}) => {
      return e => {
        mutate({
          variables: {
            text: message,
            userId: 1,
            chatroomId: 1,
          },
        })
          .then(data => {
            return setMessage('');
          })
          .catch(e => {
            console.error(e);
          });
      };
    },
  })
)(SendMessageButton);

let MessageBox = function MessageBox({onChange, message, setMessage}) {
  return (
    <section>
      <textarea value={message} onChange={onChange} />
      <SendMessageButton message={message} setMessage={setMessage} />
    </section>
  );
};

MessageBox = compose(
  withState('message', 'setMessage', ''),
  withHandlers({
    onChange: ({setMessage}) => {
      return e => {
        return setMessage(e.target.value);
      };
    },
  })
)(MessageBox);

function Chatroom({messages = []}) {
  return (
    <section>
      {messages.map(message => {
        return (
          <section key={message.id}>
            {message.text}
          </section>
        );
      })}
      <MessageBox />
    </section>
  );
}

export default compose(
  graphql(chatrooms),
  mapProps(({data, ...rest}) => {
    const subscribeToMore = data && data.subscribeToMore;
    const chatroom = data && data.chatrooms && data.chatrooms[0];
    return {
      messages: chatroom && chatroom.messages,
      subscribeToMessages: (): void => {
        return subscribeToMore({
          document: messageAdded,
          variables: {
            chatroomId: 1,
          },
          onError: (e: Object): void => {
            return console.error('APOLLO-CHAT', e);
          },
          updateQuery: (prev: Object, {subscriptionData}: Object): Object => {
            if (!subscriptionData.data) {
              return prev;
            }

            const messageToAdd = get(subscriptionData, 'data.messageAdded');

            const chatRooms = prev.chatrooms[0];
            const prevMessages = prev.chatrooms[0].messages;
            const newMessages = [messageToAdd, ...prevMessages];

            const newChatRooms = [
              Object.assign({}, chatRooms, {messages: newMessages}),
            ];

            return Object.assign({}, {...prev, chatrooms: newChatRooms});
          },
        });
      },
      ...rest,
    };
  }),
  lifecycle({
    componentWillMount() {
      return this.props.subscribeToMessages();
    },
  })
)(Chatroom);

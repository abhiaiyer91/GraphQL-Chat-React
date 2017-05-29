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
  return <button className="button-item" onClick={sendMessage}>Send Message</button>;
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

let MessageBox = function MessageBox({
  onChange,
  message,
  closeMessages,
  setMessage,
}) {
  return (
    <section>
      <textarea
        placeholder="Enter your message"
        className="message-box"
        value={message}
        onChange={onChange}
      />
      <div className="button-wrapper">
        <button className="button-item" onClick={closeMessages}>Cancel</button>
        <SendMessageButton message={message} setMessage={setMessage} />
      </div>
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

let ChatroomRow = function ChatroomRow({
  closeMessages,
  openMessages,
  isActive,
  id,
  title,
  messages = [],
}) {
  if (!isActive) {
    return (
      <button className="chatroom" key={id} onClick={openMessages}>
        {title}
      </button>
    );
  }

  return (
    <section>
      {messages.map(message => {
        return (
          <div className="message">
            <p>{message.text}</p>
          </div>
        );
      })}
      <MessageBox closeMessages={closeMessages} />
    </section>
  );
};

ChatroomRow = compose(
  withState('isActive', 'setActive', false),
  withHandlers({
    openMessages: ({setActive}) => {
      return () => {
        return setActive(true);
      };
    },
    closeMessages: ({setActive}) => {
      return () => {
        return setActive(false);
      };
    },
  })
)(ChatroomRow);

function Chatroom({chatrooms = []}) {
  return (
    <section>
      <h1 className="title">Chatrooms</h1>
      {chatrooms.map(room => {
        return <ChatroomRow key={room.id} {...room} />;
      })}
    </section>
  );
}

export default compose(
  graphql(chatrooms),
  mapProps(({data, ...rest}) => {
    const subscribeToMore = data && data.subscribeToMore;
    const chatrooms = data && data.chatrooms;
    return {
      chatrooms,
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

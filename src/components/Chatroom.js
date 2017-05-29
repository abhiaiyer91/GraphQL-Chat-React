import React from 'react';
import gql from 'graphql-tag';
import {get, find} from 'lodash';
import update from 'immutability-helper';
import {compose, withHandlers, withState, mapProps, lifecycle} from 'recompose';
import {graphql} from 'react-apollo';

const chatrooms = gql`
{
  chatrooms {
    id
    title
  }
}
`;

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

let SendMessageButton = function SendMessageButton({sendMessage}) {
  return (
    <button className="button-item" onClick={sendMessage}>Send Message</button>
  );
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
    sendMessage: ({setMessage, id, message, mutate}) => {
      return e => {
        mutate({
          variables: {
            text: message,
            userId: 1,
            chatroomId: id,
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
  id,
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
        <SendMessageButton id={id} message={message} setMessage={setMessage} />
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

let ChatMessages = function ChatMessages({
  closeMessages,
  ready,
  title,
  id,
  messages,
}) {
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
};

ChatMessages = compose(
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
          updateQuery: (previousResult: Object, {subscriptionData}: Object): Object => {
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
      return this.props.subscribeToMessages();
    },
  })
)(ChatMessages);

let ChatroomRow = function ChatroomRow({
  closeMessages,
  openMessages,
  isActive,
  id,
  title,
}) {
  if (!isActive) {
    return (
      <button className="chatroom" key={id} onClick={openMessages}>
        {title}
      </button>
    );
  }

  return <ChatMessages closeMessages={closeMessages} title={title} id={id} />;
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
        return <ChatroomRow key={room.id} title={room.title} id={room.id} />;
      })}
    </section>
  );
}

export default compose(
  graphql(chatrooms),
  mapProps(({data, ...rest}) => {
    const chatrooms = (data && data.chatrooms) || [];
    return {
      chatrooms,
      ...rest,
    };
  })
)(Chatroom);

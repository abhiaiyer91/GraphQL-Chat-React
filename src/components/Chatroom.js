import React from 'react';
import gql from 'graphql-tag';
import { compose, mapProps } from 'recompose';
import { graphql } from 'react-apollo';

const chatrooms = gql`
{
  chatrooms {
    id
    title
    users {
      displayName
    }
    messages {
      id
      text
    }
  }
}
`;

function Chatroom({ chatroom }) {
  return (
    <div>
      THIS IS A CHATROOM
    </div>
  );
}

export default compose(
  graphql(chatrooms),
  mapProps(({ data, ...rest }) => {
    return {
      chatroom: data && data.chatrooms && data.chatrooms[0],
      ...rest,
    };
  })
)(Chatroom);

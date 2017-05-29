import React from 'react';
import gql from 'graphql-tag';
import {compose, mapProps} from 'recompose';
import {graphql} from 'react-apollo';
import ChatroomRow from './Row';

const chatrooms = gql`
{
  chatrooms {
    id
    title
  }
}
`;

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

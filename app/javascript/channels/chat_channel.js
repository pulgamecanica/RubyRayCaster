import consumer from "channels/consumer"
import { select } from "d3"

var _data;
const append_message = (data) => {
  // data = data["body"];
  let messageDiv = select("#messages-table")
    .append( "div" ).attr( "class", "message" ).attr( "id", data["id"]);
  messageDiv.append( "div" )
    .attr( "class", "message-user" ).attr( "style", "color: " + data["player"]["color"] + ";")
    .text( data["player"]["username"] );
  messageDiv.append( "div" )
    .attr( "class", "message-content" ).text( data["content"] );
  messageDiv.append( "div" )
    .attr( "class", "message-time" ).text( data["created_at"] );
}

consumer.subscriptions.create("ChatChannel", {
  connected() {
    // Called when the subscription is ready for use on the server
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
  },

  received(data) {
    append_message(data);
    // Called when there's incoming data on the websocket for this channel
  },

  update: function() {
    return this.perform('update');
  },

  user_input: function() {
    return this.perform('user_input');
  }
});

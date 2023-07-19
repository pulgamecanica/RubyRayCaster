import consumer from "channels/consumer"

consumer.subscriptions.create("GameChannel", {
  connected() {
    // Called when the subscription is ready for use on the server
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
  },

  received(data) {
    // Called when there's incoming data on the websocket for this channel
  },

  update: function() {
    return this.perform('update');
  },

  user_input: function() {
    return this.perform('user_input');
  }
});

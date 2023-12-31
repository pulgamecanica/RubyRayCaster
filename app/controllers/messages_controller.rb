class MessagesController < ApplicationController
  before_action :logged_in_player
  before_action :get_messages

  def index
  end

  def create
    message = helpers.current_player.messages.build(message_params)
    if message.save
      ActionCable.server.broadcast("chat_room", { id: message.id, player: message.player, content: message.content, created_at: message.created_at.strftime("%H:%M")  })
      redirect_to messages_url
    else
      render 'index'
    end
  end

  private

    def get_messages
      @messages = Message.latest
      @message  = helpers.current_player.messages.build
    end

    def message_params
      params.require(:message).permit(:content)
    end
end
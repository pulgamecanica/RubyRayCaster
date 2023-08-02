class GameChannel < ApplicationCable::Channel
  def subscribed
    puts "Hello"
    puts self.current_player
    # stream_from "some_channel"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def update
    puts "Some stuff"
  end

  def user_input
    puts self.current_player
  end
end

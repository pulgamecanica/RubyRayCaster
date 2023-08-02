class GameChannel < ApplicationCable::Channel
  def subscribed
    game_room = GameRoom.find_by(id: params[:id])
    if !game_room
      puts "Game Not Founded"
    else
      puts "Game Founded streaming ON..."
      stream_from game_room
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def update
    game_room = GameRoom.find_by(id: params[:id])
    puts game_room
  end

  def user_input
    puts self.current_player
  end
end

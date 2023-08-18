class GameChannel < ApplicationCable::Channel
  include Rails.application.routes.url_helpers
  def subscribed
    game_room = GameRoom.find_by(id: params[:id])
    if !game_room
      puts "Game Not Founded"
    else
      puts "Game Founded streaming ON..."
      stream_for game_room
    end
  end

  def unsubscribed
    game_room = GameRoom.find_by(id: params[:id])
    # Any cleanup needed when channel is unsubscribed
  end

  def update
    game_room = GameRoom.find_by(id: params[:id])
    elements = game_room.game_elements.map{ |elem| {element: elem, image_path: rails_blob_path(elem.image, only_path: true)} }
    GameChannel.broadcast_to(game_room, { game: game_room, elements: elements, players: game_room.players });
  end

  def user_input
    puts self.current_player
  end
end

class RoomPlayer < ApplicationRecord
  belongs_to :player
  belongs_to :game_room
end

class GameRoom < ApplicationRecord
  has_many :room_players, dependent: :destroy
	has_many :players, through: :room_players
end

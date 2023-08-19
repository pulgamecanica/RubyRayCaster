class GameRoom < ApplicationRecord
  has_many :room_players, dependent: :destroy
	has_many :players, through: :room_players
	has_many :game_elements, dependent: :destroy

	validates :map_terrain, presence: true
	validates :map_width, presence: true
	validates :map_width, numericality: {greater_than_or_equal_to: 3}

	validate :check_squared_map
	validate :check_map_height

	def check_squared_map
		return unless (map_width && map_terrain)
		errors.add(:map_terrain, "Map Terrain is not squared") unless map_terrain.length % map_width == 0
	end

	def check_map_height
		errors.add(:map_terrain, "Map Terrain should be at least 3 tiles tall") unless map_terrain.length / map_width >= 3
	end

	# Probably should also validate that the map is sourrounded all by walls
	# Would need to know which characters are walls, the user will only set up this later.
	# Should add a boolean, map_is_playable or walls_verified
	# This boolean would be change on update and will tell the user if the map is valid to play.

end

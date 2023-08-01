class Player < ApplicationRecord
	has_many :messages, dependent: :destroy
  has_many :room_players, dependent: :destroy
  has_many :game_rooms, through: :room_players
  NAME_REGEX = /\w+/
  validates :username, presence: true, uniqueness: { case_sensitive: false },
                       format: { with: /\A#{NAME_REGEX}\z/i },
                       length: { maximum: 15 }
  validates :password, presence: true, length: { minimum: 6 }
  has_secure_password
end

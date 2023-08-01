class Message < ApplicationRecord
  belongs_to :user
  validates :content, presence: true
  scope :latest, -> { order(:created_at).last(50) }
end
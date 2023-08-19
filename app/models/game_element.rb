class GameElement < ApplicationRecord
  belongs_to :game_room
  has_one_attached :image

  validates :key_code, presence: true
  validates :element_type, presence: true
  validates :element_type, inclusion: {in: ['floor', 'ceiling', 'wallN', 'wallE', "wallS", 'wallW', 'background']}
  validates :key_code, length: { is: 1 }

  validate :unique_key_code_and_element
  validate :unique_code_for_walls

  before_validation :assign_available_key_code, on: :create


  def assign_available_key_code
    # Iterate from A to z if the key code is founded
    self.key_code = "A"
    57.times do |ord|
      if GameElement.where(game_room: self.game_room, key_code: self.key_code).where.not(id: self).first.nil?
        break
      end
      self.key_code = (self.key_code.ord + 1).chr
    end
  end


  def unique_key_code_and_element
    errors.add(:key_code, "Key Code '" + key_code + "' being used for " + element_type + " already") unless GameElement.where(game_room: game_room, key_code: key_code, element_type: element_type).where.not(id: self).empty?
  end

  def unique_code_for_walls
    # Scenario 1: Wall Exists with code X, something else trys on X
    # Scenario 2: Something else exists with code X, wall trys on X
    other_element = GameElement.where(game_room: game_room, key_code: key_code).where.not(id: self).first
    if not other_element.nil?
      errors.add(:key_code, "Key Code for walls must be unique, make sure you are not using the key code for something else") unless other_element.is_wall? and self.is_wall? or (not other_element.is_wall? and not self.is_wall?)
    end
  end


  def floor?
    element_type == 'floor'
  end

  def ceiling?
    element_type == 'ceiling'
  end

  def is_wall?
    element_type.include?("wall")
  end

  def wallN?
    element_type == 'wallN'
  end

  def wallE?
    element_type == 'wallE'
  end

  def wallS?
    element_type == 'wallE'
  end

  def wallW?
    element_type == 'wallE'
  end

  def background?
    element_type == 'background'
  end

end

class GameElement < ApplicationRecord
  validates :element_type, inclusion: {in: ['floor', 'ceiling', 'wallN', 'wallE', "wallS", 'wallW', 'background']}
  validates :key_code, length: { is: 1 }
  belongs_to :game_room
  has_one_attached :image

  def floor?
    element_type == 'floor'
  end

  def ceiling?
    element_type == 'ceiling'
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

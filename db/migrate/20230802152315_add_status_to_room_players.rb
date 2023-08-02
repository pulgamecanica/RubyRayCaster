class AddStatusToRoomPlayers < ActiveRecord::Migration[7.0]
  def change
    add_column :room_players, :status, :integer
    add_column :room_players, :pX, :integer
    add_column :room_players, :pY, :integer
  end
end

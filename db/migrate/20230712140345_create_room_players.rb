class CreateRoomPlayers < ActiveRecord::Migration[7.0]
  def change
    create_table :room_players do |t|
      t.references :player, null: false, foreign_key: true
      t.references :game_room, null: false, foreign_key: true
      t.integer :morale
      t.integer :energy

      t.timestamps
    end
  end
end

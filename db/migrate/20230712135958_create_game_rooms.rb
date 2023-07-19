class CreateGameRooms < ActiveRecord::Migration[7.0]
  def change
    create_table :game_rooms do |t|
      t.text :map_terrain
      t.text :map_objects
      t.integer :map_width
      t.integer :map_height

      t.timestamps
    end
  end
end

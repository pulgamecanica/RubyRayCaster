class RemoveHeightFromGameRoom < ActiveRecord::Migration[7.0]
  def change
    remove_column :game_rooms, :map_height, :integer
    remove_column :game_rooms, :map_objects, :text
  end
end

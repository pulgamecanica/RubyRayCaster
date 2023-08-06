class CreateGameElements < ActiveRecord::Migration[7.0]
  def change
    create_table :game_elements do |t|
      t.string :element_type
      t.string :key_code
      t.references :game_room, null: false, foreign_key: true

      t.timestamps
    end
  end
end

class CreatePlayers < ActiveRecord::Migration[7.0]
  def change
    create_table :players do |t|
      t.string :name
      t.string :bio
      t.string :color

      t.timestamps
    end
  end
end

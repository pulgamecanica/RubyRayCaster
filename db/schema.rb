# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2023_08_02_152315) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "game_rooms", force: :cascade do |t|
    t.text "map_terrain"
    t.text "map_objects"
    t.integer "map_width"
    t.integer "map_height"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "messages", force: :cascade do |t|
    t.text "content"
    t.bigint "player_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["player_id"], name: "index_messages_on_player_id"
  end

  create_table "players", force: :cascade do |t|
    t.string "name"
    t.string "bio"
    t.string "color"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest"
    t.string "username"
    t.index ["username"], name: "index_players_on_username", unique: true
  end

  create_table "room_players", force: :cascade do |t|
    t.bigint "player_id", null: false
    t.bigint "game_room_id", null: false
    t.integer "morale"
    t.integer "energy"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status"
    t.integer "pX"
    t.integer "pY"
    t.index ["game_room_id"], name: "index_room_players_on_game_room_id"
    t.index ["player_id"], name: "index_room_players_on_player_id"
  end

  add_foreign_key "messages", "players"
  add_foreign_key "room_players", "game_rooms"
  add_foreign_key "room_players", "players"
end

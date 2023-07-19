require "application_system_test_case"

class GameRoomsTest < ApplicationSystemTestCase
  setup do
    @game_room = game_rooms(:one)
  end

  test "visiting the index" do
    visit game_rooms_url
    assert_selector "h1", text: "Game rooms"
  end

  test "should create game room" do
    visit game_rooms_url
    click_on "New game room"

    fill_in "Map height", with: @game_room.map_height
    fill_in "Map objects", with: @game_room.map_objects
    fill_in "Map terrain", with: @game_room.map_terrain
    fill_in "Map width", with: @game_room.map_width
    click_on "Create Game room"

    assert_text "Game room was successfully created"
    click_on "Back"
  end

  test "should update Game room" do
    visit game_room_url(@game_room)
    click_on "Edit this game room", match: :first

    fill_in "Map height", with: @game_room.map_height
    fill_in "Map objects", with: @game_room.map_objects
    fill_in "Map terrain", with: @game_room.map_terrain
    fill_in "Map width", with: @game_room.map_width
    click_on "Update Game room"

    assert_text "Game room was successfully updated"
    click_on "Back"
  end

  test "should destroy Game room" do
    visit game_room_url(@game_room)
    click_on "Destroy this game room", match: :first

    assert_text "Game room was successfully destroyed"
  end
end

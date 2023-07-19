require "application_system_test_case"

class RoomPlayersTest < ApplicationSystemTestCase
  setup do
    @room_player = room_players(:one)
  end

  test "visiting the index" do
    visit room_players_url
    assert_selector "h1", text: "Room players"
  end

  test "should create room player" do
    visit room_players_url
    click_on "New room player"

    fill_in "Energy", with: @room_player.energy
    fill_in "Game room", with: @room_player.game_room_id
    fill_in "Morale", with: @room_player.morale
    fill_in "Player", with: @room_player.player_id
    click_on "Create Room player"

    assert_text "Room player was successfully created"
    click_on "Back"
  end

  test "should update Room player" do
    visit room_player_url(@room_player)
    click_on "Edit this room player", match: :first

    fill_in "Energy", with: @room_player.energy
    fill_in "Game room", with: @room_player.game_room_id
    fill_in "Morale", with: @room_player.morale
    fill_in "Player", with: @room_player.player_id
    click_on "Update Room player"

    assert_text "Room player was successfully updated"
    click_on "Back"
  end

  test "should destroy Room player" do
    visit room_player_url(@room_player)
    click_on "Destroy this room player", match: :first

    assert_text "Room player was successfully destroyed"
  end
end

require "test_helper"

class RoomPlayersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @room_player = room_players(:one)
  end

  test "should get index" do
    get room_players_url
    assert_response :success
  end

  test "should get new" do
    get new_room_player_url
    assert_response :success
  end

  test "should create room_player" do
    assert_difference("RoomPlayer.count") do
      post room_players_url, params: { room_player: { energy: @room_player.energy, game_room_id: @room_player.game_room_id, morale: @room_player.morale, player_id: @room_player.player_id } }
    end

    assert_redirected_to room_player_url(RoomPlayer.last)
  end

  test "should show room_player" do
    get room_player_url(@room_player)
    assert_response :success
  end

  test "should get edit" do
    get edit_room_player_url(@room_player)
    assert_response :success
  end

  test "should update room_player" do
    patch room_player_url(@room_player), params: { room_player: { energy: @room_player.energy, game_room_id: @room_player.game_room_id, morale: @room_player.morale, player_id: @room_player.player_id } }
    assert_redirected_to room_player_url(@room_player)
  end

  test "should destroy room_player" do
    assert_difference("RoomPlayer.count", -1) do
      delete room_player_url(@room_player)
    end

    assert_redirected_to room_players_url
  end
end

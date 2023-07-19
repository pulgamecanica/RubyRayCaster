class RoomPlayersController < ApplicationController
  before_action :set_room_player, only: %i[ show edit update destroy ]

  # GET /room_players or /room_players.json
  def index
    @room_players = RoomPlayer.all
  end

  # GET /room_players/1 or /room_players/1.json
  def show
  end

  # GET /room_players/new
  def new
    @room_player = RoomPlayer.new
  end

  # GET /room_players/1/edit
  def edit
  end

  # POST /room_players or /room_players.json
  def create
    @room_player = RoomPlayer.new(room_player_params)

    respond_to do |format|
      if @room_player.save
        format.html { redirect_to room_player_url(@room_player), notice: "Room player was successfully created." }
        format.json { render :show, status: :created, location: @room_player }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @room_player.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /room_players/1 or /room_players/1.json
  def update
    respond_to do |format|
      if @room_player.update(room_player_params)
        format.html { redirect_to room_player_url(@room_player), notice: "Room player was successfully updated." }
        format.json { render :show, status: :ok, location: @room_player }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @room_player.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /room_players/1 or /room_players/1.json
  def destroy
    @room_player.destroy

    respond_to do |format|
      format.html { redirect_to room_players_url, notice: "Room player was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_room_player
      @room_player = RoomPlayer.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def room_player_params
      params.require(:room_player).permit(:player_id, :game_room_id, :morale, :energy)
    end
end

class GameRoomsController < ApplicationController
  before_action :set_game_room, only: %i[ show edit update destroy ]

  # GET /game_rooms or /game_rooms.json
  def index
    @game_rooms = GameRoom.all
  end

  # GET /game_rooms/1 or /game_rooms/1.json
  def show
    @elements = {}
    @game_room.game_elements.each do |elem|
      if not elem.persisted?
        next
      elsif not @elements[elem.key_code]
        @elements[elem.key_code] = [];
      end
      @elements[elem.key_code].push(elem);
    end
  end

  # GET /game_rooms/new
  def new
    @game_room = GameRoom.new(map_width: 5, map_terrain: "WWWWWWOOOWWOOOWWWWWW")
  end

  # GET /game_rooms/1/edit
  def edit
    @element = @game_room.game_elements.build
  end

  # GET /game_rooms/1/edit
  def play
    @game_room = GameRoom.find(params[:game_room_id])
  end

  # POST /game_rooms or /game_rooms.json
  def create
    @game_room = GameRoom.new(game_room_params)

    respond_to do |format|
      if @game_room.save
        format.html { redirect_to game_room_url(@game_room), notice: "Game room was successfully created." }
        format.json { render :show, status: :created, location: @game_room }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @game_room.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /game_rooms/1 or /game_rooms/1.json
  def update
    respond_to do |format|
      if @game_room.update(game_room_params)
        elements = @game_room.game_elements.map{ |elem| {element: elem, image_path: rails_blob_path(elem.image, only_path: true)} }
        GameChannel.broadcast_to(@game_room, { game: @game_room, elements: elements, players: @game_room.players });
        format.html { redirect_to edit_game_room_path(@game_room), notice: "Game room was successfully updated." }
        format.json { render :show, status: :ok, location: @game_room }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @game_room.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /game_rooms/1 or /game_rooms/1.json
  def destroy
    @game_room.destroy

    respond_to do |format|
      format.html { redirect_to game_rooms_url, notice: "Game room was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_game_room
      @game_room = GameRoom.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def game_room_params
      params.require(:game_room).permit(:map_terrain, :map_width)
    end
end

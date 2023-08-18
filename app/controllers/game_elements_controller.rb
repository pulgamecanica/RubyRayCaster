class GameElementsController < ApplicationController
	protect_from_forgery
  before_action :set_game
  before_action :set_element, only: %i[ update destroy ]

  # POST /game_elements or /game_elements.json
  def create
    @element = @game.game_elements.build(element_params)
    respond_to do |format|
      if @element.save
        format.html { redirect_to edit_game_room_path(@game), notice: "Element was successfully created." }
        format.json { render :edit, status: :created, location: edit_game_room_path(@game) }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @element.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /elements/1 or /elements/1.json
  def update
    respond_to do |format|
      if @element.update(element_params)
        format.html { redirect_to edit_game_room_path(@game), notice: "Element was successfully updated." }
        format.json { render :edit, status: :ok, location: edit_game_room_path(@game) }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @element.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /elements/1 or /elements/1.json
  def destroy
  	if (@element.image)
  		@element.image.purge
    end
    @element.destroy
    respond_to do |format|
      format.html { redirect_to edit_game_room_path(@game), notice: "Element was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private      
    def set_game
      @game = GameRoom.find(params[:game_room_id])
    end

    def set_element
      @element = @game.game_elements.find(params[:id])
    end

    def element_params
      params.require(:game_element).permit(:element_type, :key_code, :image)
    end

end


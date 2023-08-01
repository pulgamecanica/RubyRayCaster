class SessionsController < ApplicationController
  def new
  end

  def create
    player = Player.find_by(username: params[:session][:username].downcase)
    respond_to do |format|
      if player && player.authenticate(params[:session][:password])
        helpers.log_in player
        format.html { redirect_to messages_url, notice: "Loged in." }
        format.json { render :messages_url, status: 200, location: messages_url }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @player.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    helpers.log_out
    redirect_to login_url
  end
end

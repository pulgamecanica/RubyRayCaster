class ApplicationController < ActionController::Base
	protect_from_forgery with: :exception

    # Confirms a logged-in user.
    def logged_in_player
      unless helpers.logged_in?
        redirect_to login_url, notice: "Please Log in!"
      end
    end
end

module SessionsHelper
  # Logs in the given user.
  def log_in(player)
    cookies.signed[:player_id] = player.id
  end

  def log_out
    cookies.delete(:player_id)
    @current_player = nil
  end

  # Returns the current logged-in player (if any).
  def current_player
    @current_player ||= Player.find_by(id: cookies.signed[:player_id])
  end

  # Returns true if the user is logged in, false otherwise.
  def logged_in?
    !current_player.nil?
  end
end

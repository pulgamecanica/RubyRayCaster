Rails.application.routes.draw do
  resources :room_players
  resources :players
  resources :game_rooms do
    get 'play'
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end

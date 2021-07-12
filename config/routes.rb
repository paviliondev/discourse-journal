DiscourseJournal::Engine.routes.draw do
  post '/update-sort-order' => 'journal#update_sort_order'
end

Discourse::Application.routes.append do
  mount ::DiscourseJournal::Engine, at: 'journal'
end
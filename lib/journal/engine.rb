module ::DiscourseJournal
  class Engine < Rails::Engine
    engine_name 'discourse_journal'
    isolate_namespace DiscourseJournal
  end
end
# frozen_string_literal: true

module DiscourseJournal
  module TopicViewExtension
    def journal
      Topic.journal_enabled(@topic)
    end
  end
end

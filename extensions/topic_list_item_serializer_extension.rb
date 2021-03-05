# frozen_string_literal: true

module DiscourseJournal
  module TopicListItemSerializerExtension
    def self.included(base)
      base.attributes :journal, :entry_count
    end

    def journal
      true
    end

    def include_journal?
      Topic.journal_enabled object
    end
    
    def entry_count
      object.entry_count
    end
    
    def include_entry_count?
      include_journal?
    end
  end
end

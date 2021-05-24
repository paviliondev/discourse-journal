# frozen_string_literal: true

module DiscourseJournal
  module TopicViewSerializerExtension
    def self.included(base)
      base.attributes(
        :journal,
        :journal_author,
        :last_entry_at,
        :last_commented_on,
        :entry_count,
        :comment_count,
        :last_entry_post_number,
        :first_entry_id,
        :can_create_entry
      )
    end

    def first_entry_id
      object.topic.first_entry&.id
    end

    def journal
      object.topic.journal
    end

    def last_entry_at
      object.topic.last_entry_at
    end

    def include_last_entry_at?
      journal
    end

    def last_commented_on
      object.topic.last_commented_on
    end

    def include_last_commented_on?
      journal
    end

    def entry_count
      object.topic.entry_count
    end

    def include_entry_count?
      journal
    end

    def comment_count
      object.topic.comment_count
    end

    def include_comment_count?
      journal
    end

    def last_entry_post_number
      object.topic.last_entry_post_number
    end

    def include_last_entry_post_number?
      journal
    end

    def journal_author
      BasicUserSerializer.new(
        object.topic.journal_author,
        scope: scope,
        root: false
      )
    end

    def include_journal_author?
      journal
    end

    def can_create_entry
      scope.can_create_entry_on_topic?(object.topic)
    end
  end
end

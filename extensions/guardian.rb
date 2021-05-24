# frozen_string_literal: true

module DiscourseJournal
  module GuardianExtension
    def can_create_post_on_topic?(topic)
      if journal?(topic) && post_is_journal_entry?
        user_in_author_groups(topic) || @user.id === topic.user_id
      else
        super
      end
    end

    def can_create_entry_on_topic?(topic)
      journal?(topic) && user_in_author_groups(topic)
    end

    def journal?(topic)
      topic&.category&.journal
    end

    def post_is_journal_entry?
      post_opts && !post_opts[:reply_to_post_number]
    end

    def can_wiki?(post)
      return false if post && post.topic.category&.journal
      super
    end

    def user_in_author_groups(topic)
      topic&.category&.journal_author_groups.include?('everyone') ||
      topic&.category&.journal_author_groups.include?(@user.groups.map(&:name))
    end
  end
end

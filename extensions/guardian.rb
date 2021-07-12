# frozen_string_literal: true

module DiscourseJournal
  module GuardianExtension
    def can_create_post_on_topic?(topic)
      can_create_entry_on_topic?(topic) || super
    end

    def can_create_post?(parent)
      can_create_entry_on_topic?(parent) || super
    end

    def can_create_entry_on_topic?(topic)
      topic&.journal? && (user_in_author_groups(topic) || user_created_topic(topic))
    end

    def post_is_journal_entry?(post)
      post && post.reply_to_post_number.blank?
    end

    def user_created_topic(topic)
      @user.id === topic&.user_id
    end

    def can_wiki?(post)
      !post&.topic&.journal? && super
    end

    def user_in_author_groups(topic)
      topic&.category&.journal_author_groups.include?('everyone') ||
      ((topic&.category&.journal_author_groups & @user.groups.map(&:name)).size > 0)
    end
  end
end

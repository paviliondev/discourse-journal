# frozen_string_literal: true

module DiscourseJournal
  module GuardianExtension
    def can_create_post_on_topic?(topic)
      return @user.id === topic.user_id if (
        topic&.category&.journal &&
        post_opts &&
        !post_opts[:reply_to_post_number]
      )
      super
    end
    
    def can_wiki?(post)
      return false if post && post.topic.category&.journal
      super
    end
  end
end

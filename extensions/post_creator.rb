# frozen_string_literal: true

module DiscourseJournal
  module PostCreatorExtension
    def valid?
      valid = super
      return false if !valid

      if guardian.journal?(@topic) && post_is_journal_entry?(@post)
        guardian.can_create_entry_on_topic?(@topic)
      else
        valid
      end
    end
  end
end

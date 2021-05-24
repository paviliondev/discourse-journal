# frozen_string_literal: true

module DiscourseJournal
  module CategoryCustomFieldExtension
    def self.included(base)
      base.after_commit :update_post_order, if: :journal_changed
    end

    def journal_changed
      name == 'journal'
    end

    def update_post_order
      Jobs.enqueue(:update_category_post_order, category_id: category_id)
    end
  end
end

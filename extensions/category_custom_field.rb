# frozen_string_literal: true

module DiscourseJournal
  module CategoryCustomFieldExtension
    def self.included(base)
      base.after_commit :update_sort_order, if: :journal_changed
    end

    def journal_changed
      name == 'journal'
    end

    def update_sort_order
      Jobs.enqueue(:update_journal_category_sort_order, category_id: category_id)
    end
  end
end

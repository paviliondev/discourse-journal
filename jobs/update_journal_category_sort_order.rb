# frozen_string_literal: true

module Jobs
  class UpdateJournalCategorySortOrder < ::Jobs::Base
    def execute(args)
      category = Category.find_by(id: args[:category_id])
      return if category.blank?

      Topic.where(category_id: category.id).each do |topic|
        if topic.journal
          topic.journal_update_sort_order
        else
          topic.posts.each do |post|
            post.update_columns(sort_order: post.post_number)
          end
        end
      end
    end
  end
end

# frozen_string_literal: true

module Jobs
  class UpdateCategoryPostOrder < ::Jobs::Base
    def execute(args)
      category = Category.find_by(id: args[:category_id])

      return if category.blank?

      journal_enabled = category.journal

      Topic.where(category_id: category.id).each do |topic|
        if journal_enabled
          Topic.journal_update_post_order(topic.id)
        else
          topic.posts.each do |post|
            post.update_columns(sort_order: post.post_number)
          end
        end
      end
    end
  end
end

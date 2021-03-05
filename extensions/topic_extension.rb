# frozen_string_literal: true

module DiscourseJournal
  module TopicExtension
    def self.included(base)
      base.extend(ClassMethods)
    end

    def reload(options = nil)
      @entries = nil
      @comments = nil
      @journal_author = nil
      super(options)
    end

    def entries
      @entries ||= begin
        posts
          .where(reply_to_post_number: nil)
          .order('created_at ASC')
      end
    end

    def first_entry
      posts
        .where(reply_to_post_number: nil)
        .where.not(post_number: 1)
        .order('sort_order')
        .first
    end

    def comments
      @comments ||= begin
        posts
          .where.not(reply_to_post_number: nil)
          .order('created_at ASC')
      end
    end

    def entry_count
      entries.count
    end

    def comment_count
      comments.count
    end

    def last_entry_at
      return unless entries.any?

      entries.last[:created_at]
    end

    def last_commented_on
      return unless comments.any?

      comments.last[:created_at]
    end

    def last_entry_post_number
      return unless entries.any?

      entries.last[:post_number]
    end

    def journal
      Topic.journal_enabled(self)
    end
    
    def journal_author
      return unless entries.any?
      @journaler ||= User.find(entries.last[:user_id])
    end

    module ClassMethods

      def journal_enabled(topic)
        return false unless SiteSetting.journal_enabled
        return false if !topic || topic&.is_category_topic?

        topic.category.present? && topic.category.journal
      end

      def journal_update_post_order(topic_id)
        return unless SiteSetting.journal_enabled

        posts = Post.where(topic_id: topic_id)
        first_post = posts.find_by(post_number: 1)
        first_post.update(sort_order: 1)

        count = 2

        first_post.comments.each do |comment|
          comment.update(sort_order: count)
          count += 1
        end

        entries = begin
          posts
            .where(reply_to_post_number: nil)
            .where.not(post_number: 1)
            .order("post_number ASC")
        end

        entries.each do |entry|
          entry.update(sort_order: count)

          comments = entry.comments
          if comments.any?
            comments.each do |comment|
              count += 1
              comment.update(sort_order: count)
            end
          end

          count += 1
        end
      end
    end
  end
end

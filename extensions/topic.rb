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
      @journal_post_map = nil
      super(options)
    end

    def entries
      @entries ||= begin
        posts
          .where(reply_to_post_number: nil)
          .order('created_at ASC')
      end
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

    def journal_author
      return unless entries.any?
      @journal_author ||= User.find(entries.last[:user_id])
    end

    def journal?
      return false unless SiteSetting.journal_enabled
      return false if is_category_topic?
      category.present? && category.journal?
    end

    def journal_post_map
      @journal_post_map ||= begin
        map = {}
        post_number = 1

        entries.with_deleted.each do |entry|
          map[entry.id] = [post_number]

          self.class.gather_replies(entry)
            .sort_by(&:created_at)
            .each do |reply|
              post_number += 1
              map[reply.id] = [post_number, entry.id]
            end

          post_number += 1
        end

        map
      end
    end

    def journal_update_sort_order
      return unless SiteSetting.journal_enabled

      post_map_values = journal_post_map.map do |post_id, attrs|
        "(#{post_id}::int,#{attrs.first}::int)"
      end.join(",")

      Post.transaction do
        DB.exec <<~SQL
          WITH ordered_posts (id, new_sort_order) AS (
            VALUES #{post_map_values}
          )
          UPDATE
            posts as p
          SET
            sort_order = o.new_sort_order
          FROM
            ordered_posts AS o
          WHERE
            p.id = o.id AND
            p.topic_id = #{self.id}
        SQL
      end
    end

    module ClassMethods
      def gather_replies(post, replies = [])
        post_replies = Post.with_deleted.where(
          topic_id: post.topic_id,
          reply_to_post_number: post.post_number
        )

        return [] if post_replies.empty?

        post_replies.each do |reply|
          replies << reply
          replies_to_reply = gather_replies(reply)
          replies += replies_to_reply if replies_to_reply.any?
        end

        return replies
      end
    end
  end
end

# frozen_string_literal: true

# name: discourse-journal
# about: Create journals in discourse
# version: 0.1.0
# authors: Angus McLeod
# url: https://github.com/paviliondev/discourse-journal

enabled_site_setting :journal_enabled

register_asset "stylesheets/common/journal.scss"
register_asset "stylesheets/desktop/journal.scss", :desktop
register_asset "stylesheets/mobile/journal.scss", :mobile

after_initialize do
  %w(
    ../lib/journal/engine.rb
    ../extensions/category_custom_field_extension.rb
    ../extensions/guardian_extension.rb
    ../extensions/post_creator_extension.rb
    ../extensions/topic_extension.rb
    ../extensions/topic_list_item_serializer_extension.rb
    ../extensions/topic_view_extension.rb
    ../extensions/topic_view_serializer_extension.rb
    ../jobs/update_category_post_order.rb
  ).each do |path|
    load File.expand_path(path, __FILE__)
  end

  Category.register_custom_field_type('journal', :boolean)
  add_to_class(:category, :journal) { ActiveModel::Type::Boolean.new.cast(custom_fields['journal']) }
  add_to_serializer(:basic_category, :journal) { object.journal }
  Site.preloaded_category_custom_fields << 'journal' if Site.respond_to?(:preloaded_category_custom_fields)  
  
  add_to_serializer(:post, :journal) { object.topic.journal }

  class ::Guardian
    attr_accessor :post_opts
    prepend DiscourseJournal::GuardianExtension
  end

  ::Topic.include DiscourseJournal::TopicExtension
  ::TopicView.prepend DiscourseJournal::TopicViewExtension
  ::TopicViewSerializer.include DiscourseJournal::TopicViewSerializerExtension
  ::TopicListItemSerializer.include DiscourseJournal::TopicListItemSerializerExtension
  ::CategoryCustomField.include DiscourseJournal::CategoryCustomFieldExtension
end

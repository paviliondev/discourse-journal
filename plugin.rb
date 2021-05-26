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
    ../extensions/category_custom_field.rb
    ../extensions/guardian.rb
    ../extensions/post_creator.rb
    ../extensions/topic.rb
    ../extensions/topic_list_item_serializer.rb
    ../extensions/topic_view.rb
    ../extensions/topic_view_serializer.rb
    ../jobs/update_category_post_order.rb
  ).each do |path|
    load File.expand_path(path, __FILE__)
  end

  register_category_custom_field_type("journal", :boolean)
  add_to_class(:category, :journal) do
    ActiveModel::Type::Boolean.new.cast(custom_fields["journal"])
  end
  add_to_class(:category, :journal_author_groups) do
    if custom_fields["journal_author_groups"].present?
      custom_fields["journal_author_groups"].split("|")
    else
      []
    end
  end
  Site.preloaded_category_custom_fields << "journal"
  Site.preloaded_category_custom_fields << "journal_author_groups"

  add_to_serializer(:basic_category, :journal) { object.journal }
  add_to_serializer(:basic_category, :journal_author_groups) { object.journal_author_groups }
  add_to_serializer(:post, :journal) { object.topic.journal }

  ::Guardian.prepend DiscourseJournal::GuardianExtension
  ::Topic.include DiscourseJournal::TopicExtension
  ::TopicView.prepend DiscourseJournal::TopicViewExtension
  ::TopicViewSerializer.include DiscourseJournal::TopicViewSerializerExtension
  ::TopicListItemSerializer.include DiscourseJournal::TopicListItemSerializerExtension
  ::CategoryCustomField.include DiscourseJournal::CategoryCustomFieldExtension
end

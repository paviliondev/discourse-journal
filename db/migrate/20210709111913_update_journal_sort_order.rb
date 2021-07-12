class UpdateJournalSortOrder < ActiveRecord::Migration[6.1]
  def change
    Topic.where("category_id IN (
      SELECT category_id FROM category_custom_fields
      WHERE name = 'journal' AND value::boolean IS TRUE
    )").each do |topic|
      topic.journal_update_sort_order
    end
  end
end

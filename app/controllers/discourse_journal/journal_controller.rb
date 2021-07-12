class ::DiscourseJournal::JournalController < Admin::AdminController
  def update_sort_order
    params.require(:category_id)
    Jobs.enqueue(:update_journal_category_sort_order, category_id: params[:category_id])
    render json: success_json
  end
end
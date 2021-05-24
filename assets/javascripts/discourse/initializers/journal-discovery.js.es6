import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed from "discourse-common/utils/decorators";

export default {
  name: "journal-discovery",
  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (!siteSettings.journal_enabled) return;

    withPluginApi('0.8.12', api => {
      api.modifyClass('component:d-navigation', {
        @discourseComputed("hasDraft", "category.journal")
        createTopicLabel(hasDraft, journalCategory) {
          if (journalCategory) {
            return "topic.create_journal.label";
          } else {
            return this._super(...arguments);
          }
        },
      });

      api.modifyClass('route:discovery', {
        discoveryCategory() {
          return this.controllerFor("navigation/category").get("category");
        },

        actions: {
          didTransition() {
            const category = this.discoveryCategory();
            if (category && category.journal) {
              $("body").addClass("journal-category");
            }
            return this._super();
          },

          willTransition() {
            const category = this.discoveryCategory();
            if (category && category.journal) {
              $("body").removeClass("journal-category");
            }
            return this._super();
          },
        }
      })
    });
  }
}
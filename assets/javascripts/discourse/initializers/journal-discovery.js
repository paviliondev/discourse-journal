import discourseComputed from "discourse/lib/decorators";
import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "discourse-journal";

export default {
  name: "journal-discovery",
  initialize(container) {
     const siteSettings = container.lookup("service:site-settings");
    if (!siteSettings.journal_enabled) {
      return;
    }

    withPluginApi("0.8.12", (api) => {
      api.modifyClass("component:d-navigation", {
        pluginId: PLUGIN_ID,

        @discourseComputed("hasDraft", "category.journal")
        createTopicLabel(hasDraft, journalCategory) {
          if (journalCategory) {
            return "topic.create_journal.label";
          } else {
            return this._super(...arguments);
          }
        },
      });

      api.modifyClass("route:discovery", {
        pluginId: PLUGIN_ID,

        discoveryCategory() {
          if (this.router.currentRouteName === "discovery.category") {
            return this.router.currentRoute.attributes.category;
          } else {
            return null;
          }
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
        },
      });
    });
  },
};

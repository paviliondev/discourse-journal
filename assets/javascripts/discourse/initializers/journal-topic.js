import discourseComputed, { on, observes } from "discourse-common/utils/decorators";
import KeyboardShortcuts from "discourse/lib/keyboard-shortcuts";
import { withPluginApi } from "discourse/lib/plugin-api";
import RenderGlimmer from "discourse/widgets/render-glimmer";
import { scheduleOnce } from "@ember/runloop";
import { hbs } from "ember-cli-htmlbars";
import { deepMerge } from "discourse-common/lib/object";

const PLUGIN_ID = "discourse-journal";

export default {
  name: "journal-topic",
  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (!siteSettings.journal_enabled) {
      return;
    }

    withPluginApi("0.8.12", api => {
      api.modifyClass('route:topic', {
        pluginId: PLUGIN_ID,

        isJournal() {
          const controller = this.controllerFor("topic");
          const topic = controller.get("model");
          return topic.journal;
        },

        actions: {
          didTransition() {
            if (this.isJournal()) {
              KeyboardShortcuts.pause(["c"]);
              $("body").addClass("topic-journal");
            }
            return this._super(...arguments);
          },

          willTransition() {
            if (this.isJournal()) {
              KeyboardShortcuts.unpause(["c"]);
              $("body").removeClass("topic-journal");
            }
            return this._super(...arguments);
          },
        }
      });

      api.modifyClass("model:topic", {
        pluginId: PLUGIN_ID,

        @discourseComputed("journal")
        showJournalTip(journalEnabled) {
          return journalEnabled && siteSettings.journal_show_topic_tip;
        },

        @discourseComputed("highest_post_number", "url", "last_entry_post_number")
        lastPostUrl(highestPostNumber, url, lastEntryPostNumber) {
          return lastEntryPostNumber ?
            this.urlForPostNumber(lastEntryPostNumber) :
            this.urlForPostNumber(highestPostNumber);
        }
      });

      api.modifyClass("component:topic-footer-buttons", {
        pluginId: PLUGIN_ID,

        didInsertElement() {
          this._super(...arguments);

          const journalEnabled = this.get("topic.journal");
          if (journalEnabled) {
            scheduleOnce("afterRender", () => {
              $(
                ".topic-footer-main-buttons > button.create",
                this.element
              ).hide();
            });
          }
        }
      });

      //TODO Consider re-implementing in future
      // api.reopenWidget("timeline-scrollarea", {
      //   html(attrs, state) {
      //     const result = this._super(attrs, state);

      //     if (siteSettings.journal_entries_timeline && attrs.topic.journal) {
      //       const position = this.position();

      //       result.push(
      //         this.attach("timeline-entries",
      //           deepMerge(position, attrs)
      //         )
      //       );
      //     }

      //     return result;
      //   }
      // });

      //TODO Consider re-implementing in future
      // api.reopenWidget("timeline-last-read", {
      //   html(attrs) {
      //     if (attrs.journal) {
      //       return '';
      //     } else {
      //       return this._super(...arguments);
      //     }
      //   }
      // })

      api.modifyClass("component:topic-progress", {
        pluginId: PLUGIN_ID,

        @discourseComputed(
          "progressPosition",
          "topic.last_read_post_id",
          "topic.journal"
        )
        showBackButton(position, lastReadId, journalEnabled) {
          if (journalEnabled) {
            return false;
          } else {
            return this._super(...arguments);
          }
        }
      });

      api.reopenWidget("topic-map", {
        buildTopicMapSummary(attrs, state) {
            if (!attrs.journal)
              return this._super(attrs, state);

            const { collapsed } = state;
            const wrapperClass = collapsed
              ? "section.map.map-collapsed"
              : "section.map";

            return new RenderGlimmer(
              this,
              wrapperClass,
              hbs`<JournalTopicMapSummary
                @postAttrs={{@data.postAttrs}}
                @toggleMap={{@data.toggleMap}}
                @collapsed={{@data.collapsed}}
              />`,
              {
                toggleMap: this.toggleMap.bind(this),
                postAttrs: attrs,
                collapsed,
              }
            );
          },
      });
    });
  }
}

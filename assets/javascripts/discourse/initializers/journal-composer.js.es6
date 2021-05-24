import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed, { on, observes } from "discourse-common/utils/decorators";
import { REPLY, CREATE_TOPIC } from "discourse/models/composer";
import { computed } from "@ember/object";
import { alias } from "@ember/object/computed";

export default {
  name: "journal-composer",
  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (!siteSettings.journal_enabled) return;

    function getJournalComposerText(type) {
      let icon;

      if (["create_entry", "reply_to_comment"].includes(type)) {
        icon = "reply";
      } else if (type === "comment_on_entry") {
        icon = "comment";
      } else if (type === "create_journal") {
        icon = "plus";
      }

      if (!icon) return false;

      return {
        icon,
        name: `composer.composer_actions.${type}.name`,
        description: `composer.composer_actions.${type}.description`
      }
    }

    withPluginApi("0.8.12", api => {
      api.modifyClass('controller:composer', {

        @discourseComputed('model.category')
        isJournal(category) {
          return category && category.journal;
        },

        @discourseComputed('model.action', "model.post")
        journalComposerText(action, post) {
          let key;

          if (action === CREATE_TOPIC) {
            key = "create_journal";
          } else if (action === REPLY && post) {
            key = post.reply_to_post_number ? "reply_to_comment" : "comment_on_entry";
          } else {
            key = "create_entry";
          }

          return getJournalComposerText(key);
        },

        @discourseComputed("model.action", "isWhispering", "model.editConflict", "isJournal", "journalComposerText.name")
        saveLabel(modelAction, isWhispering, editConflict, isJournal, journalLabel) {
          if (isJournal) {
            return journalLabel;
          } else {
            return this._super(...arguments);
          }
        },

        @discourseComputed("model.action", "isWhispering", "isJournal", "journalComposerText.icon")
        saveIcon(modelAction, isWhispering, isJournal, journalIcon) {
          if (isJournal) {
            return journalIcon;
          } else {
            return this._super(...arguments);
          }
        },
      });

      api.modifyClass("component:composer-action-title", {
        @discourseComputed("options", "action", "model.category")
        actionTitle(opts, action, category) {
          let text = getJournalComposerText(action);
   
          if (category && category.journal && text) {            
            return I18n.t(text.name);
          } else {
            return this._super(...arguments);
          }
        }
      });

      api.modifyClass("component:composer-actions", {
        didReceiveAttrs() {
          const composer = this.get("composerModel");
          if (composer) {
            this.set("postSnapshot", composer.post);
          }
          this._super(...arguments);
        },

        commenting: alias("postSnapshot.journal"),
        commentKey: computed("commenting", function() {
          return this.post.reply_to_post_number ? "reply_to_comment" : "comment_on_entry";
        }),

        iconForComposerAction: computed("action", "commenting", function () {
          if (this.commenting) {
            return getJournalComposerText(this.commentKey).icon;
          } else {
            return this._super(...arguments);
          }
        }),

        content: computed("seq", "commenting", function () {
          if (this.commenting) {
            const text = getJournalComposerText(this.commentKey);
            return [
              {
                id: "reply_to_post",
                icon: text.icon,
                name: I18n.t(text.name),
                description: I18n.t(text.description)
              }
            ];
          } else {
            return this._super(...arguments);
          }
        })
      });
    });
  }
};
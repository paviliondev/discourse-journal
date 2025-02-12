import { computed } from "@ember/object";
import { alias } from "@ember/object/computed";
import discourseComputed from "discourse/lib/decorators";
import { withPluginApi } from "discourse/lib/plugin-api";
import { CREATE_TOPIC, EDIT, REPLY } from "discourse/models/composer";
import { i18n } from "discourse-i18n";

const PLUGIN_ID = "discourse-journal";

export default {
  name: "journal-composer",
  initialize(container) {
     const siteSettings = container.lookup("service:site-settings");
    if (!siteSettings.journal_enabled) {
      return;
    }

    function getJournalComposerKey(action, composerModel) {
      let key;
      let post = composerModel.post;

      if (action === CREATE_TOPIC) {
        key = "create_journal";
      } else if (action === REPLY && post) {
        key = post.comment ? "reply_to_comment" : "create_comment";
      } else if (action === EDIT && post) {
        key = post.comment ? "edit_comment" : "edit_entry";
      } else {
        key = "create_entry";
      }

      return key;
    }

    function getJournalComposerText(type) {
      let icon = "reply";

      if (type === "create_comment") {
        icon = "comment";
      } else if (type === "create_journal") {
        icon = "plus";
      } else if (["edit_entry", "edit_comment"].includes(type)) {
        icon = "pencil-alt";
      }

      return {
        icon,
        name: `composer.composer_actions.${type}.name`,
        description: `composer.composer_actions.${type}.description`,
      };
    }

    withPluginApi("0.8.12", (api) => {
      api.modifyClass("service:composer", {
        pluginId: PLUGIN_ID,

        open(opts) {
          if (opts.topic && opts.topic.journal && opts.quote && !opts.post) {
            opts.post = opts.topic.postStream.posts[0];
          }
          return this._super(opts);
        },

        @discourseComputed("model.category")
        isJournal(category) {
          return category && category.journal;
        },

        @discourseComputed("model.action", "model.post")
        journalComposerText(action) {
          let key = getJournalComposerKey(action, this.model);
          return getJournalComposerText(key);
        },

        @discourseComputed(
          "model.action",
          "isWhispering",
          "model.editConflict",
          "isJournal",
          "journalComposerText.name"
        )
        saveLabel(
          modelAction,
          isWhispering,
          editConflict,
          isJournal,
          journalLabel
        ) {
          if (isJournal) {
            return journalLabel;
          } else {
            return this._super(...arguments);
          }
        },

        @discourseComputed(
          "model.action",
          "isWhispering",
          "isJournal",
          "journalComposerText.icon"
        )
        saveIcon(modelAction, isWhispering, isJournal, journalIcon) {
          if (isJournal) {
            return journalIcon;
          } else {
            return this._super(...arguments);
          }
        },
      });

      api.modifyClass("component:composer-action-title", {
        pluginId: PLUGIN_ID,

        @discourseComputed("options", "action", "model.category")
        actionTitle(opts, action, category) {
          let key = getJournalComposerKey(action, this.model);
          let text = getJournalComposerText(key);

          if (category && category.journal && text) {
            return i18n(text.name);
          } else {
            return this._super(...arguments);
          }
        },
      });

      api.modifyClass("component:composer-actions", {
        pluginId: PLUGIN_ID,

        didReceiveAttrs() {
          const composer = this.get("composerModel");
          if (composer) {
            this.set("postSnapshot", composer.post);
          }
          this._super(...arguments);
        },

        commenting: alias("postSnapshot.journal"),
        commentKey: computed("commenting", function () {
          return getJournalComposerKey(this.action, this.composerModel);
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
                name: i18n(text.name),
                description: i18n(text.description),
              },
            ];
          } else {
            return this._super(...arguments);
          }
        }),
      });
    });
  },
};

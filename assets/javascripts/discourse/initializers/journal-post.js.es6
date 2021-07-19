import discourseComputed, { observes } from "discourse-common/utils/decorators";
import PostsWithPlaceholders from "discourse/lib/posts-with-placeholders";
import { withPluginApi } from "discourse/lib/plugin-api";
import { h } from "virtual-dom";
import { next, once } from "@ember/runloop";
import { alias } from "@ember/object/computed";

export default {
  name: "journal-post",
  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (!siteSettings.journal_enabled) return;

    withPluginApi("0.8.12", api => {
      const store = api.container.lookup("store:main");
      const appEvents = api.container.lookup("service:app-events");
      const currentUser = api.getCurrentUser();

      api.includePostAttributes(
        "journal",
        "reply_to_post_number",
        "comment",
        "showComment",
        "entry",
        "entry_post_id",
        "entry_post_ids"
      );

      api.reopenWidget("post-menu", {
        menuItems() {
          let result = siteSettings.post_menu.split("|").filter(Boolean);
          if (this.attrs.journal) {
            result = result.filter(b => b !== "reply");
          }
          return result;
        }
      });

      api.decorateWidget("post:after", function(helper) {
        const model = helper.getModel();

        if (model.attachCommentToggle && model.hiddenComments > 0) {
          let type =
            Number(siteSettings.journal_comments_default) > 0
              ? "more"
              : "all";

          return helper.attach("link", {
            action: "showComments",
            actionParam: model.entry_post_id,
            rawLabel: I18n.t(`topic.comment.show_comments.${type}`, {
              count: model.hiddenComments
            }),
            className: "show-comments"
          });
        }
      });

      api.addPostClassesCallback(attrs => {
        if (attrs.journal && !attrs.firstPost) {
          if (attrs.comment) {
            let classes = ["comment"];
            if (attrs.showComment) {
              classes.push("show");
            }
            return classes;
          } else {
            return ["entry"];
          }
        }
      });

      api.addPostMenuButton("comment", attrs => {
        if (attrs.canCreatePost && attrs.journal) {
          let replyComment = attrs.reply_to_post_number;
          let i18nKey = replyComment ? 'comment_reply' : 'comment';
          
          let args = {
            action: "openCommentCompose",
            title: `topic.${i18nKey}.help`,
            icon: replyComment ? "reply" : "comment",
            className: "comment create fade-out"
          };

          if (!attrs.mobileView && !replyComment) {
            args.label = `topic.${i18nKey}.title`;
          }

          return args;
        }
      });

      api.reopenWidget("post-stream", {
        buildKey: () => "post-stream",

        firstPost() {
          return this.attrs.posts.toArray()[0];
        },

        defaultState(attrs, state) {
          let defaultState = this._super(attrs, state);

          const firstPost = this.firstPost();
          if (!firstPost || !firstPost.journal) {
            return defaultState;
          }

          defaultState["showComments"] = [];

          return defaultState;
        },

        showComments(entryId) {
          let showComments = this.state.showComments;
          
          if (showComments.indexOf(entryId) === -1) {
            showComments.push(entryId);
            this.state.showComments = showComments;
            this.appEvents.trigger("post-stream:refresh", { force: true });
          }
        },

        html(attrs, state) {
          const firstPost = this.firstPost();
          if (!firstPost || !firstPost.journal) {
            return this._super(...arguments);
          }

          let posts = attrs.posts || [];
          let postArray = this.capabilities.isAndroid ? posts : posts.toArray();

          if (postArray[0] && postArray[0].journal) {
            let showComments = state.showComments;
            let defaultComments = Number(siteSettings.journal_comments_default);
            let commentCount = 0;
            let lastVisible = null;

            postArray.forEach((p, i) => {
              if (!p.topic) {
                return;
              }

              if (p.comment) {
                commentCount++;
                let showingComments = showComments.indexOf(p.entry_post_id) > -1;
                let shownByDefault = commentCount <= defaultComments;

                p["showComment"] = showingComments || shownByDefault;
                p["attachCommentToggle"] = false;

                if (p["showComment"]) {
                  lastVisible = i;
                }

                if ((!postArray[i + 1] || postArray[i + 1].entry) && !p["showComment"]) {
                  postArray[lastVisible]["attachCommentToggle"] = true;
                  postArray[lastVisible]["hiddenComments"] = commentCount - defaultComments;
                }
              } else { 
                p["attachCommentToggle"] = false;

                commentCount = 0;
                lastVisible = i;
              }
            });

            if (this.capabilities.isAndroid) {
              attrs.posts = postArray;
            } else {
              attrs.posts = PostsWithPlaceholders.create({
                posts: postArray,
                store
              });
            }
          }

          return this._super(attrs, state);
        }
      });

      api.modifyClass("model:post-stream", {
        journal: alias('topic.journal'),

        prependPost(post) {
          if (!this.journal) return this._super(...arguments);

          const stored = this.storePost(post);
          if (stored) {
            const posts = this.get("posts");
            let insertPost = () => posts.unshiftObject(stored);

            if (post.post_number === 2 && posts[0].post_number === 1) {
              insertPost = () => posts.insertAt(1, stored);
            }

            insertPost();
          }

          return post;
        },

        appendPost(post) {
          if (!this.journal) return this._super(...arguments);

          const stored = this.storePost(post);

          if (stored) {
            const posts = this.get("posts");

            if (!posts.includes(stored)) {
              const replyingTo = post.get("reply_to_post_number");
              let insertPost = () => posts.pushObject(stored);

              if (post.journal && replyingTo) {
                let passed = false;
                posts.some((p, i) => {
                  if (passed && !p.reply_to_post_number) {
                    insertPost = () => posts.insertAt(i, stored);
                    return true;
                  }

                  if (p.post_number === replyingTo && i < posts.length - 1) {
                    passed = true;
                  }
                });
              }

              if (!this.get("loadingBelow")) {
                this.get("postsWithPlaceholders").appendPost(insertPost);
              } else {
                insertPost();
              }
            }

            if (stored.get("id") !== -1) {
              this.set("lastAppended", stored);
            }
          }

          return post;
        }
      });

      api.reopenWidget("post-avatar", {
        html(attrs) {
          if (!attrs || !attrs.journal) {
            return this._super(...arguments);
          }

          if (attrs.comment) {
            this.settings.size = "small";
          } else {
            this.settings.size = "large";
          }

          return this._super(...arguments);
        }
      });

      api.reopenWidget("post", {
        html(attrs) {
          if (!attrs.journal) {
            return this._super(...arguments);
          }

          if (attrs.cloaked) {
            return "";
          }

          if (attrs.entry) {
            attrs.replyToUsername = null;
          }

          if (attrs.comment) {
            attrs.replyCount = null;
          }

          return this.attach("post-article", attrs);
        },

        openCommentCompose() {
          this.sendWidgetAction("showComments", this.attrs.entry_post_id);
          this.sendWidgetAction("replyToPost", this.model).then(() => {
            next(this, () => {
              const composer = api.container.lookup("controller:composer");

              if (!composer.model.post) {
                composer.model.set("post", this.model);
              }
            });
          });
        }
      });

      api.reopenWidget("reply-to-tab", {
        title: "in_reply_to",

        click() {
          if (this.attrs.journal) {
            return false;
          } else {
            return this._super(...arguments);
          }
        },
      })
    });
  }
};

import discourseComputed from "discourse-common/utils/decorators";
import PostsWithPlaceholders from "discourse/lib/posts-with-placeholders";
import { withPluginApi } from "discourse/lib/plugin-api";
import { h } from "virtual-dom";
import { next } from "@ember/runloop";

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
        "topic",
        "reply_to_post_number",
        "comment",
        "showComment",
        "entryId",
        "topicUserId",
        "entry_count"
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
            actionParam: model.entryId,
            rawLabel: I18n.t(`topic.comment.show_comments.${type}`, {
              count: model.hiddenComments
            }),
            className: "show-comments"
          });
        }
      });

      api.addPostClassesCallback(attrs => {
        if (attrs.topic.journal && !attrs.firstPost) {
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

        defaultState(attrs, state) {
          let defaultState = this._super(attrs, state);
          
          const journalEnabled = attrs.posts.toArray()[0].topic.journal;
          if (!journalEnabled) return defaultState;
          
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
          const journalEnabled = attrs.posts.toArray()[0].topic.journal;
          if (!journalEnabled) return this._super(...arguments);
          
          let posts = attrs.posts || [];
          let postArray = this.capabilities.isAndroid ? posts : posts.toArray();

          if (postArray[0] && postArray[0].journal) {
            let entryId = null;
            let showComments = state.showComments;
            let defaultComments = Number(siteSettings.journal_comments_default);
            let commentCount = 0;
            let lastVisible = null;

            postArray.forEach((p, i) => {
              if (!p.topic) {
                return;
              }

              if (p.reply_to_post_number) {
                commentCount++;
                p["comment"] = true;
                p["showComment"] =
                  showComments.indexOf(entryId) > -1 ||
                  commentCount <= defaultComments;
                p["entryId"] = entryId;
                p["attachCommentToggle"] = false;

                if (p["showComment"]) lastVisible = i;

                if (
                  (!postArray[i + 1] || !postArray[i + 1].reply_to_post_number) &&
                  !p["showComment"]
                ) {
                  postArray[lastVisible]["entryId"] = entryId;
                  postArray[lastVisible]["attachCommentToggle"] = true;
                  postArray[lastVisible]["hiddenComments"] =
                    commentCount - defaultComments;
                }
              } else {
                p["attachCommentToggle"] = false;
                p["topicUserId"] = p.topic.user_id;
                entryId = p.id;
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
        prependPost(post) {
          const journalEnabled = this.get("topic.journal");
          if (!journalEnabled) return this._super(...arguments);
          
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
          const journalEnabled = this.get("topic.journal");
          if (!journalEnabled) return this._super(...arguments);
          
          const stored = this.storePost(post);
          
          if (stored) {
            const posts = this.get("posts");

            if (!posts.includes(stored)) {
              const replyingTo = post.get("reply_to_post_number");
              const journalEnabled = this.get("topic.journal");
              let insertPost = () => posts.pushObject(stored);

              if (journalEnabled && replyingTo) {
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
          const journalEnabled = attrs.topic.journal;
          if (!journalEnabled) return this._super(...arguments);
          
          if (attrs.reply_to_post_number) {
            this.settings.size = "small";
          } else {
            this.settings.size = "large";
          }
          
          return this._super(attrs);
        }
      });

      api.reopenWidget("post", {
        html(attrs) {
          const journalEnabled = attrs.topic.journal;
          if (!journalEnabled) return this._super(...arguments);
          
          if (attrs.cloaked) {
            return "";
          }

          if (attrs.journal && !attrs.firstPost) {
            attrs.replyToUsername = null;
            
            if (!attrs.reply_to_post_number) {
              attrs.replyCount = null;
            }
          }

          return this.attach("post-article", attrs);
        },

        openCommentCompose() {
          this.sendWidgetAction("showComments", this.attrs.entryId);
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
    });
  }
};

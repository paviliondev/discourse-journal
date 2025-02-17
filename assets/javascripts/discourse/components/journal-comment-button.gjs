import Component from "@glimmer/component";
import DButton from "discourse/components/d-button";
import { action } from "@ember/object";
import Composer from "discourse/models/composer";
import { getOwner } from "@ember/owner";

export default class JournalCommentButton extends Component {
  static hidden() {
    return false;
  }

  get i18nKey() {
    return this.args.post.reply_to_post_number ? "comment_reply" : "comment";
  }

  get icon() {
    return this.args.post.reply_to_post_number ? "reply" : "comment";
  }

  get label() {
    if (!this.args.post.mobileView && !this.args.post.reply_to_post_number) {
      return `topic.${this.i18nKey}.title`;
    } else {
      return "";
    }
  }

  get title() {
    return `topic.${this.i18nKey}.help`;
  }

  @action
  openCommentCompose() {
    const opts = {
      action: Composer.REPLY,
      draftKey: this.args.post.topic.get("draft_key"),
      draftSequence: this.args.post.topic.get("draft_sequence"),
      post: this.args.post,
    };
    getOwner(this).lookup("service:composer").open(opts);
  }

  <template>
    <DButton
      class="comment create fade-out"
      ...attributes
      @action={{this.openCommentCompose}}
      @icon={{this.icon}}
      @label={{this.label}}
      @title={{this.title}}
    />
  </template>
}

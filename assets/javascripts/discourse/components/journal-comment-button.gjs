import Component from "@glimmer/component";
import DButton from "discourse/components/d-button";

export default class CommentButton extends Component {
  static hidden() {
    return false;
  }

  get i18nKey() {
    return this.args.post.reply_to_post_number ? "comment_reply" : "comment";
  }

  get label() {
    if (!this.args.post.mobileView && !this.args.post.reply_to_post_number){
      return `topic.${this.i18nKey}.title`;
    } else {
      return "";
    }
  }

  get title() {
    return `topic.${this.i18nKey}.help`;
  }

  <template>
    <DButton
      class="post-action-menu__comment create fade-out"
      ...attributes
      @action={{@buttonActions.replyToPost}}
      @icon={{if this.args.post.reply_to_post_number "reply" "comment"}}
      @label={{this.label}}
      @title={{this.title}}
    />
  </template>

}

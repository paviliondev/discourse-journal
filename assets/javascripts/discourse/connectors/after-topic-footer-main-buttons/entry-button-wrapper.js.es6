import { getOwner } from "discourse-common/lib/get-owner";

export default {
  setupComponent(attrs, component) {
    const currentUser = getOwner(this).lookup("current-user:main");
    const topic = attrs.topic;
    const journalEnabled = topic.journal;
    const canCreatePost = topic.get("details.can_create_post");
    const userCreatedTopic = topic.user_id === currentUser.id;

    component.set('showCreateEntry', journalEnabled && userCreatedTopic && canCreatePost);
  },

  actions: {
    createEntry() {
      const controller = getOwner(this).lookup("controller:topic");
      controller.send("replyToPost");
    }
  }
};

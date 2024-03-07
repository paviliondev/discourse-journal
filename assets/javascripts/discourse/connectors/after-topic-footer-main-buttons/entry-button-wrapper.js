import { getOwner } from "@ember/application"

export default {
  actions: {
    createEntry() {
      const controller = getOwner(this).lookup("controller:topic");
      controller.send("replyToPost");
    }
  }
};

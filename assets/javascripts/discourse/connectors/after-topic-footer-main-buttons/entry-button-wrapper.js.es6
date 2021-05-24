import { getOwner } from "discourse-common/lib/get-owner";

export default {
  actions: {
    createEntry() {
      const controller = getOwner(this).lookup("controller:topic");
      controller.send("replyToPost");
    }
  }
};

import { cookAsync } from "discourse/lib/text";
import Component from "@ember/component";
import { bind } from "@ember/runloop";

export default Component.extend({
  classNames: ["journal-topic-tip"],

  didInsertElement() {
    this._super(...arguments);

    $(document).on("click", bind(this, this.documentClick));

    const rawDetails = I18n.t(this.details);
    if (rawDetails) {
      cookAsync(rawDetails).then(cooked => {
        this.set("cookedDetails", cooked);
      });
    }
  },

  willDestroyElement() {
    $(document).off("click", bind(this, this.documentClick));
  },

  documentClick(e) {
    const $element = $(this.element);
    const $target = $(e.target);

    if ($target.closest($element).length < 1 && this._state !== "destroying") {
      this.set("showDetails", false);
    }
  },

  actions: {
    toggleDetails() {
      this.toggleProperty("showDetails");
    }
  }
});

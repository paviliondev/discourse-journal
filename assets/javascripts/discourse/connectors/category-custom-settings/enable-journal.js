import { ajax } from "discourse/lib/ajax";

export default {
  actions: {
    updateSortOrder() {
      this.set("updatingSortOrder", true);

      ajax("/journal/update-sort-order", {
        type: "POST",
        data: {
          category_id: this.category.id,
        },
      })
        .then((result) => {
          let syncResultIcon = result.success ? "check" : "times";

          this.setProperties({
            updatingSortOrder: false,
            syncResultIcon,
          });
        })
        .catch(() => {
          this.setProperties({
            syncResultIcon: "times",
            updatingSortOrder: false,
          });
        })
        .finally(() => {
          setTimeout(() => {
            this.set("syncResultIcon", null);
          }, 6000);
        });
    },
  },
};

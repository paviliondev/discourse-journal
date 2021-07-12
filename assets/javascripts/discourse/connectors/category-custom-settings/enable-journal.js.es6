import { ajax } from "discourse/lib/ajax";

export default {
  setupComponent(attrs, component) {
    const category = attrs.category;

    if (!category.custom_fields) {
      category.custom_fields = {};
    }

    if (!category.custom_fields.journal_author_groups) {
      category.custom_fields.journal_author_groups = "";
    }

    const site = component.get("site");
    const siteGroups = this.site.groups;
    const authorGroups = category.custom_fields.journal_author_groups
      .split("|")
      .filter(a => a.length != "");

    this.setProperties({
      authorGroups,
      siteGroups,
      categoryId: category.id
    });
  },

  actions: {
    onSelectAuthorGroup(authorGroups) {
      this.setProperties({
        authorGroups,
        "category.custom_fields.journal_author_groups": authorGroups.join('|')
      });
    },

    updateSortOrder() {
      this.set('updatingSortOrder', true);

      ajax('/journal//update-sort-order', {
        type: "POST",
        data: {
          category_id: this.categoryId
        }
      }).then(result => {
        let syncResultIcon = result.success ? "check" : "times";

        this.setProperties({
          updatingSortOrder: false,
          syncResultIcon
        });
      }).catch(() => {
        this.setProperties({
          syncResultIcon: 'times',
          updatingSortOrder: false
        });
      }).finally(() => {
        setTimeout(() => {
          this.set('syncResultIcon', null);
        }, 6000);
      })
    }
  }
};

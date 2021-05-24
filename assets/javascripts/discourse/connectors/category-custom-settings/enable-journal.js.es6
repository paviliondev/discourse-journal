export default {
  setupComponent(attrs, component) {
    if (!attrs.category.custom_fields) {
      attrs.category.custom_fields = {};
    }

    if (!attrs.category.custom_fields.journal_author_groups) {
      attrs.category.custom_fields.journal_author_groups = "";
    }

    const site = component.get("site");
    const siteGroups = this.site.groups;
    const authorGroups = attrs.category.custom_fields.journal_author_groups
      .split("|")
      .filter(a => a.length != "");

    this.setProperties({
      authorGroups,
      siteGroups
    });
  },

  actions: {
    onSelectAuthorGroup(authorGroups) {
      this.setProperties({
        authorGroups,
        "category.custom_fields.journal_author_groups": authorGroups.join('|')
      });
    }
  }
};

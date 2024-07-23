import GroupChooser from "select-kit/components/group-chooser";
import discourseComputed from "discourse-common/utils/decorators";
import { action } from "@ember/object";

export default GroupChooser.extend({
  valueProperty: "name",
  labelProperty: "name",

  didReceiveAttrs() {
    this._super(...arguments);
    const category = this.get("category");
    if (category.custom_fields?.journal_author_groups) {
      this.set(
        "value",
        category.custom_fields.journal_author_groups.split("|").filter((a) => a.length !== "")
      )
    }
  },

  @discourseComputed("site.groups")
  content(siteGroups) {
    return siteGroups;
  },

  actions: {
    onChange(authorGroups) {
      const category = this.get("category");
      const customFields = category.custom_fields || {};
      customFields['journal_author_groups'] =  authorGroups.join("|");
      this.setProperties({
        "value": authorGroups,
        "category.custom_fields": customFields
      });
    },
  },
});
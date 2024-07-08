import Component from "@glimmer/component";
import DTooltip from "float-kit/components/d-tooltip";
import i18n from "discourse-common/helpers/i18n";
import dIcon from "discourse-common/helpers/d-icon";

export default class JournalTopicTip extends Component {
  <template>
    <div class="journal-topic-tip">
      <DTooltip @placement="right-start">
        <:trigger>
          <div class="btn btn-topic-tip">
            <span class="d-button-label">{{i18n @label}}</span>
            {{dIcon "info-circle"}}
          </div>
        </:trigger>
        <:content>
          <div class="tip-details">
            {{i18n @details}}
          </div>
        </:content>
      </DTooltip>
    </div>
  </template>
};

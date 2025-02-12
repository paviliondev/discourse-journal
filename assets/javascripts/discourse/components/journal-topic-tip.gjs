import Component from "@glimmer/component";
import dIcon from "discourse/helpers/d-icon";
import { i18n } from 'discourse-i18n';
import DTooltip from "float-kit/components/d-tooltip";

export default class JournalTopicTip extends Component {
  <template>
    <div class="journal-topic-tip">
      <DTooltip @placement="right-start">
        <:trigger>
          <div class="btn btn-topic-tip">
            <span class="d-button-label">{{i18n @label}}</span>
            {{dIcon "circle-info"}}
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

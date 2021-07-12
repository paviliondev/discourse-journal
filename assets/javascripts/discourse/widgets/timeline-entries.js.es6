import { createWidget } from "discourse/widgets/widget";
import { h } from "virtual-dom";

createWidget("timeline-entries", {
  tagName: "div.timeline-entries",

  html(attrs, state) {
    const { topic, current } = attrs;

    const $scrollArea = $(".timeline-scrollarea");
    const scrollAreaHeight = $scrollArea.height();
    const entryPostIds = topic.entry_post_ids;
    const postStream = topic.postStream;
    const stream = postStream.get("stream");
    const totalPosts = postStream.get("filteredPostsCount");
    const count = entryPostIds.length;

    let contents = [
      this.attach("link", {
        className: "entries-title",
        rawLabel: `${count} ${I18n.t('entry_lowercase', { count })}`,
        action: "jumpTop",
      })
    ];
    let entryList = [];

    entryPostIds.forEach((postId, index) => {
      let entryNumber = index + 1;
      let currentEntry = (stream.indexOf(postId) + 1);
      let entryPercent = currentEntry / totalPosts;
      let position = Math.floor(entryPercent * scrollAreaHeight);

      entryList.push({
        entryNumber,
        current,
        currentEntry,
        position,
        scrollAreaHeight
      });
    });

    contents.push(
      h('.entry-list', 
        entryList.map((marker, index) => {
          return this.attach('entry-marker',
            Object.assign(marker, {
              even: (index % 2 == 0)
            })
          );
        })
      )
    );

    return contents;
  }
});

const buffer = 4;
const markerHeight = 5;

createWidget("entry-marker", {
  tagName: "div",
  buildKey: (attrs) => `entry-marker-${attrs.entryNumber}`,

  buildAttributes(attrs) {
    const { position, entryNumber } = attrs;

    return {
      style: `top: ${position - buffer}px; height: ${markerHeight}px`,
      title: I18n.t("topic.entry.jump_to", { entryNumber })
    };
  },

  buildClasses(attrs) {
    let classes = 'entry-marker';

    if (attrs.current === attrs.currentEntry) {
      classes += ' active';
    }

    classes += attrs.even ? ' even' : ' odd';

    return classes;
  },

  html(attrs, state) {
    if (state.showNumber || attrs.current === attrs.currentEntry) {
      return h('span', `${attrs.entryNumber}`);
    } else {
      return '';
    }
  },

  click(e) {
    const percent =  ($(e.target).offset().top - (markerHeight/2) + buffer);
    this.sendWidgetAction("updatePercentage", percent);
    this.sendWidgetAction("commit");
  },

  mouseOver() {
    this.state.showNumber = true;
    this.scheduleRerender();
  },

  mouseOut() {
    this.state.showNumber = false;
    this.scheduleRerender();
  }
})
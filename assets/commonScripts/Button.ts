import AudioPlayer from "./core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Button extends cc.Component {
  onLoad() {}
  start() {
    this.node.on(
      cc.Node.EventType.TOUCH_START,
      e => {
        AudioPlayer.playEffectByUrl("sound/通用-按钮");
      },
      this
    );
  }

  // update (dt) {}
}

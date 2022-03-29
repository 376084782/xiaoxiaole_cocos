import Utils from "../../commonScripts/utils/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class StarAddSkill extends cc.Component {
  @property(cc.MotionStreak)
  motion: cc.MotionStreak = null;

  @property(sp.Skeleton)
  grid: sp.Skeleton = null;

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  async setType(type) {
    this.motion.texture = (await Utils.load(
      `ani/tuo/${type}`,
      cc.Texture2D
    )) as cc.Texture2D;
    this.grid.setAnimation(1, "doudong" + type, false);
  }
  start() {}

  // update (dt) {}
}

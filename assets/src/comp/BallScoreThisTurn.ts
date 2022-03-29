import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import EventManager from "../../commonScripts/core/EventManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BallScoreThisTurn extends cc.Component {
  score = 0;
  flagShow = false;
  @property(cc.Label)
  txtScore: cc.Label = null;

  doAdd(score) {
    if (score == 0) {
      return;
    }
    this.score += score;
    if (this.score < 0) {
      this.score = 0;
    }
    this.txtScore.string = "" + this.score;
  }
  async doShow(scoreAdd) {
    this.flagShow = true;
    this.score = 0;
    this.txtScore.string = "1";
    cc.tween(this.node)
      .to(0.2, { scale: 1.2, opacity: 255 })
      .to(0.2, { scale: 1 })
      .start();
  }
  async doHide(totalTime = 6 / 30) {
    if (this.score > 0) {
      let eachTime = totalTime / this.score;
      for (let i = 0; i < this.score; i++) {
        await PromiseUtil.wait(eachTime);
        this.doAdd(-1);
      }
    }
    this.flagShow = false;
    cc.tween(this.node)
      .to(0.2, { scale: 1.2 })
      .to(0.2, { scale: 0, opacity: 255 })
      .start();
  }
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    this.node.scale = 0;
    this.node.opacity = 0;
    this.flagShow = false;
    this.txtScore.string = "1";
  }

  // update (dt) {}
}

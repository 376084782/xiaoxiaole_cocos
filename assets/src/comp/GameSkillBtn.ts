import Utils from "../../commonScripts/utils/Utils";
import EventManager from "../../commonScripts/core/EventManager";
import SocketManager from "../manager/SocketManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameSkillBtn extends cc.Component {
  @property(cc.String)
  url: string = "";

  @property(cc.Boolean)
  isSelf: boolean = true;

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  async start() {
    this.doUpdate();

    EventManager.on("game/showAniStart", this.doUpdate, this);
    EventManager.on("game/goNextRound", this.doUpdate, this);
  }
  onDestroy() {
    EventManager.off("game/showAniStart", this.doUpdate, this);
    EventManager.off("game/goNextRound", this.doUpdate, this);
  }
  async doUpdate() {
    let url = `切图/4主界面/${this.url}${
      SocketManager.powerSeat == (this.isSelf ? 1 : 2) ? "亮" : "暗"
    }`;
    console.log("updaye", url);
    let ctrBtn = this.getComponent(cc.Button);
    ctrBtn.normalSprite = (await Utils.load(
      url,
      cc.SpriteFrame
    )) as cc.SpriteFrame;
  }

  // update (dt) {}
}

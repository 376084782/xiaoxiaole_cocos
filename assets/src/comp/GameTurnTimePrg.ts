import SocketManager from "../manager/SocketManager";
import Utils from "../../commonScripts/utils/Utils";
import EventManager from "../../commonScripts/core/EventManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameTurnTimePrg extends cc.Component {
  @property(cc.Node)
  prgL: cc.Node = null;
  @property(cc.Node)
  prgH: cc.Node = null;

  @property(cc.Label)
  txt: cc.Label = null;

  @property(cc.Sprite)
  txtNum: cc.Sprite = null;
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    this.txtNum.node.active = false;
    this.prgL.active = false;
    this.prgH.active = false;
    this.txt.node.active = false;
    EventManager.on("game/toggleTimer", this.toggleTimer, this);
  }
  onDestroy() {
    EventManager.off("game/toggleTimer", this.toggleTimer, this);
  }
  get prg() {
    this.prgL.active = SocketManager.powerSeat == 1;
    this.prgH.active = SocketManager.powerSeat == 2;
    return SocketManager.powerSeat == 1 ? this.prgL : this.prgH;
  }
  reset() {
    this.txtNum.node.active = false;
    this.lastShowSec = -1;
    this.flagMoving = false;
    this.prg.width = 0;
    this.updateTxt();

    cc.tween(this.prg)
      .to(0.3, { width: 710 })
      .call(e => {
        this.startTimer();
      })
      .start();
  }
  flagMoving = false;
  startTime = 0;
  endTime = 0;
  startTimer() {
    this.txtNum.node.active = false;
    this.updateTxt();
    this.startTime = new Date().getTime();
    this.flagMoving = true;
  }
  toggleTimer(flag) {
    this.updateTxt();
    this.flagMoving = flag;
    this.endTime = SocketManager.matchInfo.timeNextStep;
  }
  lastShowSec = -1;
  update() {
    if (this.flagMoving) {
      let endTime = SocketManager.matchInfo.timeNextStep;
      // let total = endTime - this.startTime;
      let total = 20000;
      let left = endTime - new Date().getTime();
      let prg = 0;
      if (total > 0 && left >= 0) {
        prg = left / total;
      }
      let secLeft = Math.floor(left / 1000);
      if (secLeft < 0) {
        secLeft = 0;
      }
      this.timeAni(secLeft);

      if (SocketManager.powerSeat == 1 && secLeft < 10) {
        this.txt.string = `时间到了:${secLeft}`;
      }
      this.prg.width = prg * 710;
    }
  }
  timeAni(sec: number) {
    if (this.lastShowSec == sec || sec > 3 || sec < 1) {
      return;
    }
    this.lastShowSec = sec;
    Utils.setSpImg(this.txtNum, `切图/4主界面/倒计时${sec}`);
    this.txtNum.node.active = true;
    this.txtNum.node.opacity = 0;
    this.txtNum.node.scale = 0;
    AudioPlayer.playEffectByUrl('sound/倒计时');
    cc.tween(this.txtNum.node)
      .to(0.3, { opacity: 255, scale: 1 })
      .delay(0.4)
      .to(0.3, {
        opacity: 0,
        scale: 0
      })
      .start();
  }
  updateTxt() {
    this.txt.node.active = true;
    this.txt.string = `${
      SocketManager.powerSeat == 1 ? "轮到你了" : "轮到对手"
    }`;
  }
}

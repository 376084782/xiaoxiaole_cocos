import Utils from "../../commonScripts/utils/Utils";
import GameManager from "../manager/GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemTool extends cc.Component {
  @property(cc.Node)
  btnStart: cc.Node = null;
  @property(cc.Node)
  btnStart2: cc.Node = null;

  @property(cc.Node)
  card: cc.Node = null;

  @property(cc.Sprite)
  icon: cc.Sprite = null;

  @property(cc.Label)
  num1: cc.Label = null;
  @property(cc.Label)
  num2: cc.Label = null;
  @property(cc.Label)
  num3: cc.Label = null;
  @property(cc.Node)
  wrapNum: cc.Node = null;
  @property(cc.Node)
  wrapCost: cc.Node = null;

  @property(cc.Sprite)
  bg: cc.Sprite = null;

  data: any = {}

  conf: any = {};
  setData(conf, data) {
    this.conf = conf;
    this.data = data;
    this.num1.string = "" + conf.cost;
    this.num2.string = "" + conf.cost;
    this.num3.string = '' + data.num;
    if (data.num > 0) {
      this.wrapNum.active = true;
    } else {
      this.wrapNum.active = false;
    }

    Utils.setSpImg(this.bg, `切图/2选道具/${conf.cardBg}`);
    Utils.setSpImg(this.icon, `切图/2选道具/${conf.icon}`);
  }

  start() {
    this.btnStart.active = false;
    this.changeStatus(false, false);
    this.listen();
  }
  flagSelected = false;
  changeStatus(flag = false, withAni = true) {
    let duration = withAni ? 0.15 : 0;
    this.flagSelected = flag;
    let objSelected = {
      x: -3.401,
      y: 26.146,
      angle: 2,
      scaleX: 1.05,
      scaleY: 1.05
    };
    let objNormal = {
      x: 0,
      y: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1
    };
    // let sp=this.card.getComponent(cc.Sprite) as cc.Sprite;
    // sp.text
    let btnStart = this.data.num > 0 ? this.btnStart2 : this.btnStart;
    if (flag) {
      btnStart.active = true;
      btnStart.opacity = 0;
    }
    Utils.tweenAnimate(this.wrapCost, duration, 0, { opacity: flag ? 0 : 255 });
    Utils.tweenAnimate(this.card, duration, 0, flag ? objSelected : objNormal);
    Utils.tweenAnimate(btnStart, duration, 0, {
      opacity: flag ? 255 : 0
    }).then(() => {
      btnStart.active = flag;
    });
  }
  listen() {
    this.btnStart.on(cc.Node.EventType.TOUCH_END, e => {
      GameManager.doStartGame(this.conf.id);
    });
    this.btnStart2.on(cc.Node.EventType.TOUCH_END, e => {
      GameManager.doStartGame(this.conf.id);
    });

  }

  // update (dt) {}
}

import { PopupBase } from "../../commonScripts/popups/PopupBase";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import PopupManager from "../../commonScripts/core/PopupManager";
import EventManager from "../../commonScripts/core/EventManager";
import GameManager from "../manager/GameManager";
import SocketManager from "../manager/SocketManager";
import Utils from "../../commonScripts/utils/Utils";
import GameConfig from "../config/GameConfig";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalResult extends PopupBase {
  @property(cc.Node)
  btnOK: cc.Node = null;

  onLoad() { }

  start() { }

  @property(cc.Sprite)
  avatarSelf: cc.Sprite = null;
  @property(cc.Sprite)
  avatarOppo: cc.Sprite = null;

  @property(cc.Label)
  scoreSelf: cc.Label = null;
  @property(cc.Label)
  scoreOppo: cc.Label = null;

  @property(cc.Sprite)
  bgCardSelf: cc.Sprite = null;
  @property(cc.Sprite)
  bgCardOppo: cc.Sprite = null;

  @property(cc.Sprite)
  iconCardSelf: cc.Sprite = null;
  @property(cc.Sprite)
  iconCardOppo: cc.Sprite = null;

  @property(cc.Sprite)
  txtResult: cc.Sprite = null;

  @property(cc.Node)
  areaTop: cc.Node = null;
  init({ }) {
    let userSelf = SocketManager.selfData;
    let userOppo = SocketManager.oppoData;
    let isWin = SocketManager.userInfo.uid == SocketManager.matchInfo.winner;

    this.result.score = Math.floor(userSelf.score / 2);
    if (isWin) {
      if (userSelf.score - userOppo.score >= 40) {
        this.result.star = 3;
      } else if (userSelf.score - userOppo.score >= 30) {
        this.result.star = 2;
      } else if (userSelf.score - userOppo.score >= 15) {
        this.result.star = 1;
      } else {
        this.result.star = 0;
      }
    } else {
      this.result.star = 0;
    }
    this.result.jumpUrl = `${Utils.host}/#/pages/pos/game/startGame/victory?isVictory=${isWin ? 1 : 2
      }&number=1&orderId=${SocketManager.orderMap[SocketManager.userInfo.uid]}`;
    AudioPlayer.playEffectByUrl(
      `sound/${isWin ? "胜利结算音效" : "结算界面失败音效"}`
    );
    this.btnOK.active = false;
    this.areaTop.active = false;

    this.showAni();

    Utils.setSpImgFromNet(this.avatarSelf, userSelf.avatar);
    Utils.setSpImgFromNet(this.avatarOppo, userOppo.avatar);

    this.scoreSelf.string = "" + userSelf.score;
    this.scoreOppo.string = "" + userOppo.score;

    let propConfigSelf = GameConfig.propList.find(e => e.id == userSelf.propId);
    let propConfigOppo = GameConfig.propList.find(e => e.id == userOppo.propId);
    Utils.setSpImg(this.bgCardOppo, `切图/2选道具/${propConfigOppo.cardBg}`);
    Utils.setSpImg(this.bgCardSelf, `切图/2选道具/${propConfigSelf.cardBg}`);
    Utils.setSpImg(this.iconCardOppo, `切图/2选道具/${propConfigOppo.icon}`);
    Utils.setSpImg(this.iconCardSelf, `切图/2选道具/${propConfigSelf.icon}`);

    let txtImg = `切图/5结算/你${isWin ? "赢" : "输"}了`;
    Utils.setSpImg(this.txtResult, txtImg);
  }
  result = {
    star: 2,
    score: 30,
    jumpUrl:
      Utils.host + "/#/pages/pos/game/startGame/victory"
  };
  @property(sp.Skeleton)
  aniBg: sp.Skeleton = null;
  showAni() {
    this.aniBg.setAnimation(1, this.result.star + "xing", false);
    PromiseUtil.wait(0.43 + this.result.star * 0.1).then(e => {
      this.doAfterStar();
    });
  }
  async doAfterStar() {
    cc.tween(this.areaTop)
      .set({
        opacity: 0,
        scale: 1,
        active: true
      })
      .to(0.2, {
        scale: 1.2,
        opacity: 255
      })
      .to(0.2, {
        scale: 1
      })
      .start();
    await PromiseUtil.wait(0.6);
    this.btnOK.active = true;
    cc.tween(this.btnOK)
      .set({
        scale: 0
      })
      .to(0.2, { scale: 1.1 })
      .to(0.1, { scale: 1 })
      .call(e => {
        this.btnOK.on(cc.Node.EventType.TOUCH_END, e => {
          location.href = this.result.jumpUrl;
          // GameManager.flagCanEnterMatch = true;
          // EventManager.removeAll();
          // PopupManager.clearAllModal();
          // PopupManager.show("modal/ModalTool");
        });
      })
      .start();
  }

  // update (dt) {}
}

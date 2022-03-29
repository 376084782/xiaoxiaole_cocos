import Utils from "../../commonScripts/utils/Utils";
import { PopupBase } from "../../commonScripts/popups/PopupBase";
import EventManager from "../../commonScripts/core/EventManager";
import SocketManager from "../manager/SocketManager";
import MathUtil from "../../commonScripts/utils/MathUtil";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";
import PopupManager from "../../commonScripts/core/PopupManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalMatch extends PopupBase {
  @property(sp.Skeleton)
  bg: sp.Skeleton = null;
  @property(sp.Skeleton)
  ani: sp.Skeleton = null;

  @property(cc.Node)
  wrapLeft: cc.Node = null;

  @property(cc.Node)
  wrapRight: cc.Node = null;

  @property(cc.Node)
  wrapAvatarOppo: cc.Node = null;

  @property(cc.Node)
  wrapTimeWaiting: cc.Node = null;

  @property(cc.Node)
  avatarBlue: cc.Node = null;
  @property(cc.Node)
  avatarRed: cc.Node = null;

  @property(cc.Node)
  btnCancel: cc.Node = null;
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    this.listen();
    this.initAll();
    this.showAni();
  }
  @property(cc.Sprite)
  avatarSelf: cc.Sprite = null;
  @property(cc.Sprite)
  avatarOppo: cc.Sprite = null;
  @property(cc.Label)
  nameSelf: cc.Label = null;
  @property(cc.Label)
  nameOppo: cc.Label = null;
  @property(cc.Label)
  scoreSelf: cc.Label = null;
  @property(cc.Label)
  scoreOppo: cc.Label = null;

  @property(cc.Label)
  timeWaitTotal: cc.Label = null;
  @property(cc.Label)
  timeWaited: cc.Label = null;
  init({ userInfo }) {
    this.wrapAvatarOppo.active = false;
    Utils.setSpImgFromNet(this.avatarSelf, userInfo.avatar);
    this.nameSelf.string = Utils.subString(userInfo.nickname, 12);
    this.scoreSelf.string = "0";

    Utils.doAjax({
      url: "/getUserInfoById",
      method: "post",
      data: {
        userId: userInfo.uid
      }
    }).then((e1: any) => {
      this.scoreSelf.string = "" + e1.gamepoint;
    });

    let time = MathUtil.getRandomInt(9, 20);
    this.timeWaitTotal.string = Utils.timeFormat("预计等待:MM:SS", time);

    let sec = 0;
    this.timeWaited.string = Utils.timeFormat("已等待:MM:SS", sec);
    this.schedule(e => {
      sec++;
      this.timeWaited.string = Utils.timeFormat("已等待:MM:SS", sec);
    }, 1);
  }

  onDestroy() {
    EventManager.remove("game/matched");
    EventManager.remove("match/cancel");
  }
  listen() {
    EventManager.on(
      "game/matched",
      e => {
        this.showAniMatched(e);
      },
      this
    );
    EventManager.on(
      "match/cancel",
      e => {
        this.hide();
      },
      this
    );
    this.btnCancel.on(cc.Node.EventType.TOUCH_END, e => {
      SocketManager.sendMessage("MATCH", {
        matchId: SocketManager.matchId,
        flag: false,
        type: SocketManager.type,
        lp: SocketManager.lp,
        roomId: SocketManager.roomId
      });
    });
  }
  @property(cc.Node)
  aniPP: cc.Node = null;
  async showAni() {
    AudioPlayer.stopAllMusic();
    PromiseUtil.wait(55 / 30).then(e => {
      AudioPlayer.playMusicByUrl("sound/通用-匹配");
    });

    this.ani.setAnimation(1, "PIPEI1", false);

    // 0-5帧，BJ动画透明度出现（用时0-5帧）
    Utils.tweenAnimate(this.bg.node, 5 / 30, 0, {
      opacity: 255
    }).then(e => {
      EventManager.emit("game/closeModalTool");
    });
    PromiseUtil.wait(15 / 30).then(e => {
      AudioPlayer.playEffectByUrl("sound/匹配-自己的bar出现的音效");
    });

    // 15-25帧，玩家头像框和ID放大出现（15-20，0%-110%，淡出）（20-25，110%-100%）
    Utils.tweenAnimate(this.wrapLeft, 5 / 30, 15 / 30, {
      scale: 1.1,
      opacity: 255
    });
    Utils.tweenAnimate(this.wrapLeft, 5 / 30, 20 / 30, {
      scale: 1
    });
    // 17-27帧，玩家分数信息放大出现（17-22，从0%-110%，淡出）（22-27，110%-100%）
    Utils.tweenAnimate(this.wrapRight, 5 / 30, 17 / 30, {
      scale: 1.1,
      opacity: 255
    });
    Utils.tweenAnimate(this.wrapRight, 5 / 30, 22 / 30, {
      scale: 1
    });

    // 40帧匹配转动头像框出现播放txk_pp动画
    PromiseUtil.wait(55 / 30).then(e => {
      this.wrapAvatarOppo.active = true;
    });
    // 55-60帧 等待倒计时文字跟随头像框向右移动同时透明度出现
    Utils.tweenAnimate(this.wrapAvatarOppo, 5 / 30, 55 / 30, {
      x: -146.168
    });
    Utils.tweenAnimate(this.wrapTimeWaiting, 5 / 30, 55 / 30, {
      opacity: 255,
      x: 141
    });
  }

  @property(cc.Node)
  wrapLeft2: cc.Node = null;

  @property(cc.Node)
  wrapRight2: cc.Node = null;
  async showAniMatched(infoOppo) {
    Utils.setSpImgFromNet(this.avatarOppo, infoOppo.avatar);
    this.nameOppo.string = Utils.subString(infoOppo.nickname, 12);

    this.scoreOppo.string = "0";
    if (!infoOppo.isRobot) {

      Utils.doAjax({
        url: "/getUserInfoById",
        method: "post",
        data: {
          userId: infoOppo.uid
        }
      }).then((e1: any) => {
        this.scoreOppo.string = "" + e1.gamepoint;
      });
    } else {
      console.log('isRobot')
      this.scoreOppo.string = "" + infoOppo.score;

    }

    AudioPlayer.stopAllMusic();
    this.ani.setAnimation(1, "PIPEI2", false);
    // 0-5帧，txk_pp动画和倒计时信息缩小50% 同时透明度降低消失
    Utils.tweenAnimate(this.wrapTimeWaiting, 5 / 30, 0, {
      scale: 0.5,
      opacity: 0
    });
    Utils.tweenAnimate(this.wrapAvatarOppo, 5 / 30, 0, {
      scale: 0.5,
      opacity: 0
    });
    // 67-75帧，BJ动画透明度消失
    Utils.tweenAnimate(this.bg.node, (75 - 67) / 30, 67 / 30, {
      opacity: 0
    });

    // 78帧，放开开始从上方一排排依次掉落，（0-7落下，淡出）（7-10，反弹）（10-15，回复原位） 其中每一排中间间隔2帧。
    PromiseUtil.wait(86 / 30).then(e => {
      AudioPlayer.playEffectByUrl("sound/匹配成功-对方bar出现的音效");
    });

    // 86-94帧，对手头像框出现（86-91，0%-110%，淡出）（91-94，110%-100%）
    Utils.tweenAnimate(this.wrapLeft2, (91 - 86) / 30, 86 / 30, {
      opacity: 255,
      scale: 1.1
    });
    Utils.tweenAnimate(this.wrapLeft2, (94 - 91) / 30, 91 / 30, {
      scale: 1
    });

    // 99-105帧，对手头像框从中间往左移动
    Utils.tweenAnimate(this.wrapLeft2, (105 - 99) / 30, 99 / 30, {
      x: -164.725
    });
    PromiseUtil.wait(102 / 30).then(e => {
      AudioPlayer.playEffectByUrl("sound/匹配成功-对方bar出现积分的音效");
    });
    // 102-110帧，对手分数信息出现（102-107，0%-110%，淡出）（107-110，110%-100%）
    Utils.tweenAnimate(this.wrapRight2, (107 - 102) / 30, 102 / 30, {
      scale: 1.1,
      opacity: 255
    });
    Utils.tweenAnimate(this.wrapRight2, (110 - 107) / 30, 107 / 30, {
      scale: 1
    });
    // 130-140帧 ，蓝色框和信息透明度消失
    Utils.tweenAnimate(this.wrapRight, (140 - 130) / 30, 130 / 30, {
      opacity: 0
    });
    // 132-142帧，红色框和信息透明度消失
    Utils.tweenAnimate(this.wrapRight2, (142 - 132) / 30, 132 / 30, {
      opacity: 0
    });
    // 145-158帧，自己头像和姓名移动到对战界面上方（淡入）
    Utils.tweenAnimate(this.wrapLeft, (158 - 145) / 30, 145 / 30, {
      scale: 0.8,
      x: this.avatarBlue.x,
      y: this.avatarBlue.y
    });

    // 147-160帧，对手头像和姓名移动到对战界面上方（淡入）
    Utils.tweenAnimate(this.wrapLeft2, (160 - 147) / 30, 147 / 30, {
      scale: 0.8,
      x: this.avatarRed.x,
      y: this.avatarRed.y
    });

    // 150-158帧，背景变亮
    Utils.tweenAnimate(this.background, (158 - 150) / 30, 150 / 30, {
      opacity: 0
    }).then(e => {
      EventManager.emit("game/showAvatarTop");
      this.hide();
    });
  }

  initAll() {
    this.bg.node.opacity = 0;

    this.wrapLeft.opacity = 0;
    this.wrapLeft.scale = 0;
    this.wrapRight.opacity = 0;
    this.wrapRight.scale = 0;

    this.wrapAvatarOppo.x = 0;
    this.wrapTimeWaiting.opacity = 0;
    this.wrapTimeWaiting.x = 0;

    this.wrapLeft2.opacity = 0;
    this.wrapLeft2.scale = 0;
    this.wrapLeft2.x = 0;
    this.wrapRight2.opacity = 0;
    this.wrapRight2.scale = 0;
  }
  // update (dt) {}
}

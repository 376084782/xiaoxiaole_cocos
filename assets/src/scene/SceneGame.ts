import PopupManager from "../../commonScripts/core/PopupManager";
import GameBoard from "../comp/GameBoard";
import EventManager from "../../commonScripts/core/EventManager";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import GameBarBtm from "../comp/GameBarBtm";
import GameScoreBoard from "../comp/GameScoreBoard";
import GameManager from "../manager/GameManager";
import GameBarCenter from "../comp/GameBarCenter";
import GameRoundTxtPlayer from "../comp/GameRoundTxtPlayer";
import SocketManager from "../manager/SocketManager";
import { PopupBase } from "../../commonScripts/popups/PopupBase";
import Utils from "../../commonScripts/utils/Utils";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SceneGame extends PopupBase {
  @property(GameScoreBoard)
  scoreBoard: GameScoreBoard = null;

  @property(GameBoard)
  board: GameBoard = null;

  @property(GameBarBtm)
  barBtm: GameBarBtm = null;

  @property(cc.Node)
  btnSetting: cc.Node = null;

  @property(GameBarCenter)
  barCenter: GameBarCenter = null;

  @property(cc.Node)
  wrapSkillStar: cc.Node = null;

  @property(cc.Node)
  star1: cc.Node = null;
  @property(cc.Node)
  star2: cc.Node = null;
  start() {
    GameManager.flagCrashing = false;
    EventManager.on("game/reloadAll", this.reloadAll, this);
    this.flowerSelf.active = false;
    this.flowerOppo.active = false;
    GameManager.wrapSkillStar = this.wrapSkillStar;
    this.resetAll();
    this.listen();
    this.board.initBoard();

    this.scheduleOnce(e => {
      GameManager.skillPosL = this.star1.convertToWorldSpaceAR(cc.v2(0, 0));
      GameManager.skillPosR = this.star2.convertToWorldSpaceAR(cc.v2(0, 0));
    }, 0.1);
  }
  reloadAll() {
    PopupManager.clearAllModal();
    SocketManager.onConnect();
  }
  resetAll() {
    this.scoreBoard.resetAll();
    this.barCenter.resetAll();
  }

  @property(GameRoundTxtPlayer)
  txtRoundPlayer: GameRoundTxtPlayer = null;

  @property(cc.Node)
  maskOppo: cc.Node = null;

  @property(cc.Node)
  lightSelf: cc.Node = null;
  @property(cc.Node)
  lightOppo: cc.Node = null;

  @property(cc.Node)
  arrowSelf: cc.Node = null;
  @property(cc.Node)
  arrowOppo: cc.Node = null;

  @property(cc.Node)
  flowerSelf: cc.Node = null;
  @property(cc.Node)
  flowerOppo: cc.Node = null;

  async aniShow(isReconnect = false) {
    AudioPlayer.stopAllMusic();
    AudioPlayer.playMusicByUrl("sound/游戏bgm-前凑（只在开始放一次）");
    PromiseUtil.wait(8.494).then(e => {
      AudioPlayer.stopAllMusic();
      AudioPlayer.playMusicByUrl(
        "sound/游戏bgm-完美循环（放在前凑后面，无限循环）"
      );
    });

    this.maskOppo.active = SocketManager.powerSeat != 1;
    this.lightSelf.active = SocketManager.powerSeat == 1;
    this.lightOppo.active = SocketManager.powerSeat != 1;
    this.arrowSelf.active = SocketManager.powerSeat == 1;
    this.arrowOppo.active = SocketManager.powerSeat != 1;
    this.barCenter.aniShow();
    await PromiseUtil.wait(1.4);
    this.barBtm.showBtns();
    await PromiseUtil.wait(0.6);
    this.board.aniShow();
    // 播放第一回合字动画
    this.txtRoundPlayer.doPlay();
    this.scoreBoard.changeHH(
      SocketManager.matchInfo.round,
      SocketManager.powerSeat
    );
  }

  @property(cc.Node)
  qiuLan: cc.Node = null;

  listScoreBlue = [];
  onDestroy() {
    EventManager.remove("game/reloadAll");
    EventManager.remove("game/showAniStart");
    EventManager.remove("game/goNextRound");
    EventManager.remove("game/finish");
    EventManager.remove("game/showAvatarTop");
  }
  listen() {
    EventManager.on("game/showAniStart", this.aniShow, this);
    this.btnSetting.on(cc.Node.EventType.TOUCH_END, e => {
      PopupManager.show("modal/ModalSetting");
    });
    EventManager.on("game/goNextRound", e => {
      this.maskOppo.active = SocketManager.powerSeat != 1;
      this.lightSelf.active = SocketManager.powerSeat == 1;
      this.lightOppo.active = SocketManager.powerSeat != 1;
      this.arrowSelf.active = SocketManager.powerSeat == 1;
      this.arrowOppo.active = SocketManager.powerSeat != 1;
      this.txtRoundPlayer.doPlay();
      this.scoreBoard.changeHH(
        SocketManager.matchInfo.round,
        SocketManager.powerSeat
      );
      this.barCenter.changeRound(
        SocketManager.matchInfo.round,
        SocketManager.matchInfo.turn
      );
      if (
        SocketManager.matchInfo.turn == 1 ||
        SocketManager.matchInfo.turn == 3
      ) {
        this.board.aniShow();
      }
    });
    EventManager.on("game/finish", e => {
      // 回合灯全灭
      this.barCenter.aniLight.resetAll();
      // 中间格子获胜颜色转圈动画

      this.flowerSelf.active = GameManager.isSelfWin;
      this.flowerOppo.active = !GameManager.isSelfWin;

      PromiseUtil.wait(1).then(e => {
        // 显示结果页
        if (SocketManager.isMatch) {
          this.hide();
        } else {
          PopupManager.show("modal/ModalResult", e);
        }
      });
    });
    EventManager.on("game/showAvatarTop", e => {
      this.wrapAvatar1.active = true;
      this.wrapAvatar2.active = true;
    });
  }

  @property(cc.Node)
  wrapAvatar1: cc.Node = null;
  @property(cc.Node)
  wrapAvatar2: cc.Node = null;

  @property(cc.Sprite)
  avatar1: cc.Sprite = null;
  @property(cc.Sprite)
  avatar2: cc.Sprite = null;
  @property(cc.Label)
  name1: cc.Label = null;
  @property(cc.Label)
  name2: cc.Label = null;

  @property(cc.Sprite)
  bg1: cc.Sprite = null;
  @property(cc.Sprite)
  bg2: cc.Sprite = null;
  @property(cc.Sprite)
  bgBar1: cc.Sprite = null;
  @property(cc.Sprite)
  bgBar2: cc.Sprite = null;
  init({ isReconnect }) {
    if (SocketManager.isMatch) {
      // 比赛场游戏内的显示区分
      Utils.setSpImg(this.bg1, "切图/4主界面-比赛/比赛背景1");
      Utils.setSpImg(this.bg2, "切图/4主界面-比赛/比赛背景2");
      Utils.setSpImg(this.bgBar1, "切图/4主界面-比赛/比赛底-中");
      Utils.setSpImg(this.bgBar2, "切图/4主界面-比赛/比赛底-下");
    }
    Utils.setSpImgFromNet(this.avatar1, SocketManager.selfData.avatar);
    Utils.setSpImgFromNet(this.avatar2, SocketManager.oppoData.avatar);
    this.name1.string = Utils.subString(SocketManager.selfData.nickname, 12);
    this.name2.string = Utils.subString(SocketManager.oppoData.nickname, 12);
    this.wrapAvatar1.active = false;
    this.wrapAvatar2.active = false;
    if (isReconnect) {
      this.wrapAvatar1.active = true;
      this.wrapAvatar2.active = true;

      this.scheduleOnce(e => {
        // 显示对应的回合
        this.aniShow(isReconnect);
      }, 1);
    }
  }

  // update (dt) {}
}

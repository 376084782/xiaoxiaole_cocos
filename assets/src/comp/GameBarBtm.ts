import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import PopupManager from "../../commonScripts/core/PopupManager";
import SocketManager from "../manager/SocketManager";
import EventManager from "../../commonScripts/core/EventManager";
import GameManager from "../manager/GameManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameBarBtm extends cc.Component {
  @property(cc.Node)
  btnRule: cc.Node = null;

  @property(cc.Button)
  btnChuizi1: cc.Button = null;
  @property(cc.Button)
  btnChuizi2: cc.Button = null;
  @property(cc.Button)
  btnShuffle1: cc.Button = null;
  @property(cc.Button)
  btnShuffle2: cc.Button = null;

  @property(sp.Skeleton)
  wrapAni: sp.Skeleton = null;
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    this.listen();
    this.btnRule.active = true;

    this.btnChuizi1.node.active = false;
    this.btnChuizi2.node.active = false;
    this.btnShuffle1.node.active = false;
    this.btnShuffle2.node.active = false;
  }

  onDestroy() {
    EventManager.remove("game/chuizi_chuxian");
    EventManager.remove("game/chuizi_cancel");
    EventManager.remove("game/chuizi_qiao");
    EventManager.remove("game/shuffle");
  }
  listen() {
    this.btnShuffle1.node.on(cc.Node.EventType.TOUCH_END, e => {
      if (this.btnShuffle1.interactable) {
        if (1 == SocketManager.powerSeat) {
          SocketManager.sendMessage("SHUFFLE", {});
        }
      }
    });

    EventManager.on("game/chuizi_chuxian", e => {
      EventManager.emit("game/toggleGameMask", { flag: true });
      let color = SocketManager.colorSTC(e.seat);
      let btn = color == 1 ? this.btnChuizi1 : this.btnChuizi2;
      this.wrapAni.node.active = true;
      btn.node.active = false;
      this.wrapAni.setAnimation(
        1,
        `chuizi_${color == 1 ? "l" : "h"}_chuxian`,
        false
      );

      GameManager.flagSelecting = true;
      PromiseUtil.wait(0.9).then(e => {
        this.wrapAni.setToSetupPose();
        this.wrapAni.setAnimation(
          1,
          `chuizi_${color == 1 ? "l" : "h"}_loop`,
          true
        );
      });
    });

    EventManager.on("game/chuizi_cancel", e => {
      AudioPlayer.playEffectByUrl("sound/取消选中下方道具音效");
      EventManager.emit("game/toggleGameMask", { flag: false });
      let btn = this.btnChuizi1;
      this.wrapAni.node.active = false;
      btn.node.active = true;
      GameManager.flagSelecting = false;
    });
    EventManager.on("game/chuizi_qiao", e => {
      let color = SocketManager.colorSTC(e.seat);
      let btn = color == 1 ? this.btnChuizi1 : this.btnChuizi2;
      this.wrapAni.node.active = true;
      btn.node.active = false;
      this.wrapAni.setAnimation(
        1,
        `chuizi_${color == 1 ? "l" : "h"}_xianshi`,
        false
      );
      PromiseUtil.wait(1.63).then(() => {
        btn.node.active = true;
        btn.interactable = false;
        this.wrapAni.node.active = false;
      });
    });

    this.btnChuizi1.node.on(cc.Node.EventType.TOUCH_END, e => {
      if (this.btnChuizi1.interactable) {
        if (1 == SocketManager.powerSeat) {
          EventManager.emit("game/chuizi_chuxian", {
            seat: SocketManager.selfColor
          });
        }
      }
      // btn.interactable = false;
    });

    this.btnRule.on(cc.Node.EventType.TOUCH_END, e => {
      PopupManager.show("modal/ModalRule");
    });
    EventManager.on("game/shuffle", e => {
      if (e.seat) {
        this.wrapAni.node.active = true;
        this.wrapAni.setToSetupPose();
        let color = SocketManager.colorSTC(e.seat);
        this.wrapAni.setAnimation(
          1,
          "xipai_" + (color == 1 ? "l" : "h"),
          false
        );
        let btn = color == 1 ? this.btnShuffle1 : this.btnShuffle2;
        btn.interactable = false;
        PromiseUtil.wait(1).then(e => {
          EventManager.emit("game/toggleGameMask", { flag: true });
        });
      }
    });
  }

  showBtns() {
    this.btnShuffle1.interactable = SocketManager.selfData.shuffle > 0;
    this.btnShuffle2.interactable = SocketManager.oppoData.shuffle > 0;
    this.btnChuizi1.interactable = SocketManager.selfData.chuizi > 0;
    this.btnChuizi2.interactable = SocketManager.oppoData.chuizi > 0;
    let btnList = [
      this.btnChuizi1,
      this.btnShuffle1,
      this.btnChuizi2,
      this.btnShuffle2
    ];
    btnList.forEach((btn: cc.Button, i) => {
      PromiseUtil.wait(0.07 * i).then(e => {
        btn.node.active = true;
        btn.node.scale = 0;
        cc.tween(btn.node)
          .to(0.1, { scale: 1.2 })
          .to(0.1, { scale: 1 })
          .start();
      });
    });
  }

  // update (dt) {}
}

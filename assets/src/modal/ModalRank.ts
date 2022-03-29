import EventManager from "../../commonScripts/core/EventManager";
import { PopupBase } from "../../commonScripts/popups/PopupBase";
import GameRankGroup from "../comp/GameRankGroup";
import SocketManager from "../manager/SocketManager";
import PopupManager from "../../commonScripts/core/PopupManager";
import GameManager from "../manager/GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalRank extends PopupBase {
  @property(cc.Button)
  btnRule: cc.Button = null;

  groupList1: GameRankGroup[] = [];

  groupList2: GameRankGroup[] = [];

  groupList3: GameRankGroup[] = [];

  @property(cc.ScrollView)
  scroller: cc.ScrollView = null;

  @property(cc.Node)
  wrap1: cc.Node = null;
  @property(cc.Node)
  wrap2: cc.Node = null;
  @property(cc.Node)
  wrap3: cc.Node = null;

  @property(cc.Prefab)
  prefab1: cc.Prefab = null;
  @property(cc.Prefab)
  prefab2: cc.Prefab = null;
  // LIFE-CYCLE CALLBACKS:

  @property(cc.Node)
  btnBack: cc.Node = null;
  // onLoad () {}

  start() {
    EventManager.on("game/updateRank", e => {
      this.init();
    });
    this.btnBack.on(cc.Node.EventType.TOUCH_END, e => {
      SocketManager.sendMessage("MATCH", {
        matchId: SocketManager.matchId,
        flag: false,
        type: SocketManager.type,
        lp: SocketManager.lp,
        roomId: SocketManager.roomId
      });
      setTimeout(() => {
        GameManager.doBack("backFromMatch");
      }, 500);
    });
    this.btnRule.node.on(cc.Node.EventType.TOUCH_END, e => {
      PopupManager.show("modal/ModalRule");
    });
  }
  initNode() {
    this.wrap1.removeAllChildren();
    this.wrap2.removeAllChildren();
    this.wrap3.removeAllChildren();
    this.groupList1 = [];
    this.groupList2 = [];
    this.groupList3 = [];
    for (let i = 0; i < 4; i++) {
      let sp = cc.instantiate(this.prefab1);
      let ctr = sp.getComponent(GameRankGroup);
      this.groupList1.push(ctr);
      this.wrap1.addChild(sp);
    }
    for (let i = 0; i < 2; i++) {
      let sp = cc.instantiate(this.prefab1);
      let ctr = sp.getComponent(GameRankGroup);
      this.groupList2.push(ctr);
      this.wrap2.addChild(sp);
    }
    for (let i = 0; i < 1; i++) {
      let sp = cc.instantiate(this.prefab2);
      let ctr = sp.getComponent(GameRankGroup);
      this.groupList3.push(ctr);
      this.wrap3.addChild(sp);
    }
  }
  init() {
    this.initNode();
    let rankInfo = SocketManager.lastRankInfo;
    if (rankInfo.round == 0) {
      this.setGroup(2, rankInfo.waitingList, this.groupList1);
    } else if (rankInfo.round == 1) {
      this.setGroup(1, rankInfo.list1, this.groupList1);
      this.setGroup(2, rankInfo.waitingList, this.groupList2);
    } else if (rankInfo.round == 2) {
      this.setGroup(1, rankInfo.list1, this.groupList1);
      this.setGroup(1, rankInfo.list2, this.groupList2);
      this.setGroup(2, rankInfo.waitingList, this.groupList3);
      this.scroller.scrollToBottom();
    } else if (rankInfo.round == 3) {
      this.setGroup(1, rankInfo.list1, this.groupList1);
      this.setGroup(1, rankInfo.list2, this.groupList2);
      this.setGroup(1, rankInfo.list3, this.groupList3);
      this.scroller.scrollToBottom();
    }
  }
  setGroup(type, listData: any[], listTarget: GameRankGroup[]) {
    if (type == 1) {
      listData.forEach((conf, idx) => {
        let ctr = listTarget[idx];
        if (ctr) {
          ctr.setData(conf);
        }
      });
    } else {
      listData.forEach((conf, idx) => {
        let i = Math.floor(idx / 2);
        let ctr = listTarget[i];
        if (idx % 2 == 0) {
          if (ctr) {
            ctr.setDataByList(conf, listData[idx + 1]);
          }
        }
      });
    }
  }

  onDestroy() {
    EventManager.remove("game/updateRank");
  }
  // update (dt) {}
}

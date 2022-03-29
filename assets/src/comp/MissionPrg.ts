import Progress from "../../commonScripts/Progress";
import GameConfig from "../config/GameConfig";
import Utils from "../../commonScripts/utils/Utils";
import EventManager from "../../commonScripts/core/EventManager";
import PropUser from "./PropUser";
import GameManager from "../manager/GameManager";
import SocketManager from "../manager/SocketManager";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MissionPrg extends cc.Component {
  @property(cc.Sprite)
  prg: cc.Sprite = null;

  @property(cc.Label)
  txtPrg: cc.Label = null;

  @property(sp.Skeleton)
  btnAni: sp.Skeleton = null;

  @property(cc.Node)
  btnAniWrap: cc.Node = null;

  @property(sp.Skeleton)
  aniGrid: sp.Skeleton = null;

  @property(sp.Skeleton)
  aniProp: sp.Skeleton = null;

  @property(PropUser)
  propUser: PropUser = null;

  @property
  color: number = 0;

  total = 6;

  nType = 6;
  get type() {
    return this.nType;
  }
  set type(type) {
    this.nType = type;
    this.aniGrid.setAnimation(2, "doudong" + type, false);
  }
  propId = 0;

  isActive = false;
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  current = 0;
  async setCurrent(current = this.current) {
    this.current = current;
    this.prg.node.width = 150 * (current / this.total);
    this.txtPrg.string = `${current}/${this.total}`;
    if (current >= this.total) {
      let propConfig = GameConfig.propList.find(e => e.id == this.propId);
      if (SocketManager.powerSeat != this.color || this.color != 1) {
        this.txtPrg.string = `已满`;
        this.isActive = false;
        this.btnAniWrap.active = false;
      } else {
        let data = (await Utils.load(
          `切图/0动画/导出/道具/${propConfig.ani}`,
          sp.SkeletonData
        )) as sp.SkeletonData;
        this.btnAni.skeletonData = data;
        this.btnAniWrap.active = true;
        this.btnAni.setAnimation(1, "L_dian", true);
        this.isActive = true;
      }
    } else {
      this.isActive = false;
      this.btnAniWrap.active = false;
    }
  }

  get propData() {
    let propId =
      this.color == 1
        ? SocketManager.selfData.propId
        : SocketManager.oppoData.propId;
    let propData = GameConfig.propList.find(e => e.id == propId);
    return propData;
  }
  showCard() {
    this.aniProp.node.active = true;
    this.aniProp.setAnimation(
      1,
      `${this.propData.aniNameInMission}_${
        this.color == 1 ? "Z" : "Y"
      }_chuxian`,
      false
    );
  }
  hideCard() {
    this.aniProp.setAnimation(
      1,
      `${this.propData.aniNameInMission}_${this.color == 1 ? "Z" : "Y"}_huifu`,
      false
    );
    this.txtPrg.node.active = true;
    this.prg.node.active = true;
    cc.tween(this.aniGrid.node)
      .delay(0.1)
      .to(0.2, {
        x: this.color == 1 ? -52.239 : 48.515,
        y: -18.872,
        scale: 0.6
      })
      .start();
  }
  start() {
    this.aniProp.node.active = false;
    this.txtPrg.node.active = false;
    this.prg.node.active = false;
    let x1 = -81.366;
    let x2 = 78.261;
    cc.tween(this.aniGrid.node)
      .set({
        x: this.color == 1 ? x1 : x2,
        y: 0,
        scale: 1
      })
      .start();

    this.node.on(cc.Node.EventType.TOUCH_END, async e => {
      if (this.isActive && this.color == 1) {
        if (!GameManager.flagCrashing) {
          SocketManager.sendMessage("USE_PROP", { id: this.propId });
        }
      }
    });
    EventManager.on("game/useProp", async ({ crashData }) => {
      let seatC = SocketManager.colorSTC(crashData.color);
      if (seatC == this.color) {
        this.setCurrent(0);
        this.btnAni.setToSetupPose();
        this.btnAni.setAnimation(1, "L_ting", true);
        await this.propUser.useProp(crashData);
        this.btnAniWrap.active = false;
      }
    });
    EventManager.on("game/updateSkillPrg", ({ seat, skillPrg }) => {
      let colorClient = SocketManager.colorSTC(seat);
      if (colorClient == this.color) {
        this.setCurrent(skillPrg);
      }
    });
  }

  onDestroy() {
    EventManager.remove("game/useProp");
    EventManager.remove("game/updateSkillPrg");
  }
  // update (dt) {}
}

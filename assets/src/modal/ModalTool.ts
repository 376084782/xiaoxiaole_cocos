import { PopupBase } from "../../commonScripts/popups/PopupBase";
import ItemTool from "../comp/ItemTool";
import GameConfig from "../config/GameConfig";
import PopupManager from "../../commonScripts/core/PopupManager";
import GameManager from "../manager/GameManager";
import EventManager from "../../commonScripts/core/EventManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalTool extends PopupBase {
  @property(cc.Prefab)
  prefabCard: cc.Prefab = null;

  @property(cc.Node)
  wrap: cc.Node = null;

  @property(cc.Node)
  btnRule: cc.Node = null;

  @property(cc.Node)
  btnBack: cc.Node = null;

  @property(cc.Label)
  txtCoin: cc.Label = null;
  // onLoad () {}

  selectedItem: ItemTool;
  start() {
    this.wrap.removeAllChildren();
    this.listen();
    this.renderAll();
    this.renderList();
  }
  renderAll() {
    this.txtCoin.string = "" + GameManager.coin;
  }
  listen() {
    this.btnBack.on(cc.Node.EventType.TOUCH_END, e => {
      GameManager.doBack("backFromTool");
    });
    this.btnRule.on(cc.Node.EventType.TOUCH_END, e => {
      PopupManager.show("modal/ModalRule");
    });
    EventManager.on("game/closeModalTool", e => {
      this.hide();
    });
  }
  onDestroy() {
    EventManager.remove("game/closeModalTool");
  }
  async renderList() {
    let list = await GameManager.getToolList();
    this.wrap.removeAllChildren();
    GameConfig.propList.forEach(conf => {
      let sp = cc.instantiate(this.prefabCard);
      let data = list.find(e => e.id == conf.id);
      let ctr = sp.getComponent(ItemTool);
      ctr.setData(conf, data);
      sp.on(cc.Node.EventType.TOUCH_END, e => {
        let ctr = sp.getComponent(ItemTool);
        if (this.selectedItem == ctr) {
          return;
        }
        AudioPlayer.playEffectByUrl("sound/选中&切换道具");
        if (this.selectedItem) {
          this.selectedItem.changeStatus(false);
        }
        ctr.changeStatus(true);
        this.selectedItem = ctr;
      });
      this.wrap.addChild(sp);
    });
  }
  async init() {
    await GameManager.updateCoin();
    this.renderAll();
  }

  // update (dt) {}
}

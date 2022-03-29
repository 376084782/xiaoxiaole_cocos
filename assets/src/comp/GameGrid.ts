import Utils from "../../commonScripts/utils/Utils";
import MathUtil from "../../commonScripts/utils/MathUtil";
import PopupManager from "../../commonScripts/core/PopupManager";
import SocketManager from "../manager/SocketManager";
import GameManager from "../manager/GameManager";
import StarAddSkill from "./StarAddSkill";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameGrid extends cc.Component {
  idx = 0;

  @property(sp.Skeleton)
  light: sp.Skeleton = null;

  @property(sp.Skeleton)
  icon: sp.Skeleton = null;

  @property(sp.Skeleton)
  ani: sp.Skeleton = null;

  isAlive = true;

  @property(cc.Prefab)
  prefabAddSkill: cc.Prefab = null;

  _type = 1;
  set type(type: number) {
    this._type = type;
  }
  get type() {
    return this._type;
  }

  showIcon() {
    if (!this.icon) {
      return;
    }
    this.icon.setToSetupPose();
    this.icon.clearTracks();
    if (this.type < 100) {
      this.icon.loop = false;
      this.icon.setAnimation(1, "doudong" + this.type, false);
    } else {
      let color = this.type % 100;
      this.icon.loop = true;
      if (this.type > 400) {
        this.icon.setAnimation(1, "shandian" + color, true);
      } else if (this.type > 300) {
        this.icon.setAnimation(1, "zhadan" + color, true);
      } else if (this.type > 200) {
        this.icon.setAnimation(1, "shu_jiantou" + color, true);
      } else {
        this.icon.setAnimation(1, "heng_jiantou" + color, true);
      }
    }
  }
  toggleLight(flag) {
    this.light.node.active = true;
    this.light.node.stopAllActions();
    if (flag) {
      this.light.node.opacity = 0;
      cc.tween(this.light.node)
        .to(0.2, { opacity: 255 })
        .delay(2)
        .to(0.2, {
          opacity: 0
        })
        .start();
    } else {
      cc.tween(this.light.node)
        .to(0.2, { opacity: 0 })
        .start();
    }
  }

  doDismiss() {
    let targetData =
      SocketManager.powerSeat == 1
        ? SocketManager.selfData
        : SocketManager.oppoData;
    if (this.isAlive && targetData.gridType == this.type) {
      // 判断如果是目标消除物，展示飞上去的动画
      GameManager.playMusicSpecialX();
      let star = cc.instantiate(this.prefabAddSkill);
      let ctrStarAddSkill = star.getComponent(StarAddSkill);
      ctrStarAddSkill.setType(targetData.gridType);

      let par = GameManager.wrapSkillStar;

      let pos = this.node.convertToWorldSpaceAR(
        cc.v2(this.node.width / 2, -this.node.height / 2)
      );
      par.convertToNodeSpaceAR(pos, pos);

      let posEnd1 =
        SocketManager.powerSeat == 1
          ? GameManager.skillPosL
          : GameManager.skillPosR;

      let posEnd = par.convertToNodeSpaceAR(posEnd1);

      star.x = pos.x;
      star.y = pos.y;
      par.addChild(star);

      let xx = pos.x - 45 + 90 * Math.random();
      let yy = pos.y - 45 + 90 * Math.random();
      cc.tween(star)
        .to(0.2, {
          x: xx,
          y: yy
        })
        .delay(0.4)
        .to(0.4, {
          x: posEnd.x,
          y: posEnd.y,
          scale: 0.6
        })
        .to(0.1, {
          opacity: 0
        })
        .call(e => {
          star.destroy();
        })
        .start();
    }
    AudioPlayer.playEffectByUrl("sound/普通消除音效");
    this.isAlive = false;
    this.ani.timeScale = .5;
    this.ani.setAnimation(1, "xiaochu", false);
    cc.tween(this.icon.node)
      .to(16 / 30, { opacity: 0 })
      .call(() => {
        this.node.destroy();
      })
      .start();
  }
  start() {
    this.showIcon();
  }

  // update (dt) {}
}

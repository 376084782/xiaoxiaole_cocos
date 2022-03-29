import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import SocketManager from "../manager/SocketManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoundLight extends cc.Component {
  @property([sp.Skeleton])
  listLight: sp.Skeleton[] = [];

  number = 0;
  // onLoad () {}

  //   挨个显示回合灯
  setNumberByAni(num, flagMust = false) {
    if (!flagMust) {
      if (this.number == num) {
        return;
      }
    }
    this.number = num;
    for (let i = 0; i < this.listLight.length; i++) {
      let target = this.listLight[i];
      if (target) {
        let clientColor = SocketManager.colorSTC(
          SocketManager.matchInfo.turnList[this.listLight.length - 1 - i]
        );
        let color = clientColor == 1 ? "l" : "h";
        let color2 = clientColor == 1 ? "lan" : "hong";
        target.setToSetupPose();
        target.clearTracks();
        if (num == i) {
          target.node.active = true;
          target.setAnimation(1, `xiaoshi_` + color, false);
        } else {
          target.setAnimation(2, color2, false);
          target.node.active = i < num;
        }
      }
    }
  }
  //   单次回合结束 重置四个指示灯
  async resetNumber(withAni = true) {
    this.node.scaleX = !SocketManager.selfFirst ? 1 : -1;
    for (let i = 0; i < this.listLight.length; i++) {
      let target = this.listLight[i];
      target.node.active = false;
    }
    for (let i = 0; i < this.listLight.length; i++) {
      let clientColor = SocketManager.colorSTC(
        SocketManager.matchInfo.turnList[5 - i]
      );
      let target = this.listLight[i];
      target.node.active = i > SocketManager.matchInfo.turn;
      let color = clientColor == 1 ? "l" : "h";
      target.setAnimation(1, `chuxian_` + color, false);
      if (withAni) {
        await PromiseUtil.wait(0.05);
      }
    }
  }
  resetAll() {
    for (let i = 0; i < this.listLight.length; i++) {
      let target = this.listLight[i];
      if (target) {
        target.node.active = false;
      }
    }
  }
  start() {}

  // update (dt) {}
}

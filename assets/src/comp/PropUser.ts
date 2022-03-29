import EventManager from "../../commonScripts/core/EventManager";
import Utils from "../../commonScripts/utils/Utils";
import GameBoard from "./GameBoard";
import GameManager from "../manager/GameManager";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import SocketManager from "../manager/SocketManager";
import GameGrid from "./GameGrid";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PropUser extends cc.Component {
  @property(sp.Skeleton)
  ani: sp.Skeleton = null;
  @property(cc.Node)
  shape: cc.Node = null;

  @property(cc.Prefab)
  aniSke: cc.Prefab = null;
  @property(cc.Prefab)
  prefabGrid: cc.Prefab = null;

  @property(GameBoard)
  gameBoard: GameBoard = null;
  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  async usePropBase(flagExtraMove, seat, skeName, aniName, listAction, call?) {
    this.toggleShape(true);
    this.ani.node.active = true;
    let data = (await Utils.load(
      `切图/0动画/导出/道具/${skeName}`,
      sp.SkeletonData
    )) as sp.SkeletonData;
    this.ani.skeletonData = data;
    this.ani.setCompleteListener(async e => {
      this.ani.setCompleteListener(e => {});
      if (call) {
        await call();
      }
      await this.gameBoard.showCrashByServer(listAction, seat);
      if (flagExtraMove) {
        this.gameBoard.playExtra(seat);
      }
      this.toggleShape(false);
      this.ani.node.active = false;
    });
    this.ani.setAnimation(1, `${aniName}`, false);
  }
  @property(cc.Prefab)
  lightMaozi: cc.Prefab = null;
  async useProp({ id, color, listAction, extraData, flagExtraMove }) {
    let seatC = SocketManager.colorSTC(color);
    switch (id) {
      case 1: {
        console.log('触发了=====================')
        AudioPlayer.playEffectByUrl("sound/道具音效1-烟花");
        this.toggleShape(true);
        this.ani.node.active = true;
        let data = (await Utils.load(
          `切图/0动画/导出/道具/bianpao`,
          sp.SkeletonData
        )) as sp.SkeletonData;
        this.ani.skeletonData = data;
        this.ani.setAnimation(1, `bianpao_Z`, false);
        PromiseUtil.wait(30 / 30).then(async () => {
          // 动画过程
          let node = new cc.Node();
          this.node.parent.addChild(node);
          let img = node.addComponent(cc.Sprite);
          Utils.setSpImg(img, "切图/0动画/导出/道具/BP");
          let xy = GameManager.idxToXY(extraData.idx);
          let pos = new cc.Vec2(
            this.gameBoard.space * xy.x + 49,
            -this.gameBoard.space * xy.y - 49
          );
          this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
          this.node.parent.convertToNodeSpaceAR(pos, pos);

          let posStart = cc.v2(-77.14, 449.5);
          this.node.convertToWorldSpaceAR(posStart, posStart);
          this.node.parent.convertToNodeSpaceAR(posStart, posStart);
          node.x = posStart.x;
          node.y = posStart.y;
          node.angle = 36.89;
          cc.tween(node)
            .to(6 / 30, {
              angle: 137
            })
            .to((42 - 36) / 30, {
              angle: 314.04,
              scale: 0.41
            })
            .call(() => {
              node.destroy();
            })
            .start();

          let action = cc.bezierTo((42 - 30) / 30, [
            cc.v2(posStart.x, posStart.y),
            cc.v2(posStart.x - 100, posStart.y - 500),
            pos
          ]);

          node.runAction(action);

          await PromiseUtil.wait((42 - 30) / 30);

          let aniBoom = cc.instantiate(this.aniSke);
          let widgt = aniBoom.getComponent(cc.Widget);
          widgt.destroy();
          aniBoom.x = pos.x;
          aniBoom.y = pos.y;
          this.node.parent.addChild(aniBoom);
          let ctrAni = aniBoom.getComponent(sp.Skeleton);
          let skeData = (await Utils.load(
            `切图/0动画/导出/道具/bianpao`,
            sp.SkeletonData
          )) as sp.SkeletonData;
          ctrAni.skeletonData = skeData;
          ctrAni.setAnimation(999, "baozha", false);

          await this.gameBoard.showCrashByServer(listAction, color);
          if (flagExtraMove) {
            this.gameBoard.playExtra(color);
          }
        });

        PromiseUtil.wait(90 / 30).then(e => {
          this.toggleShape(false);
        });
        PromiseUtil.wait(105 / 30).then(e => {
          this.ani.node.active = false;
        });

        break;
      }
      case 2: {
        await this.usePropBase(flagExtraMove, color, "du", `du`, listAction);

        PromiseUtil.wait(35 / 30).then(async () => {
          let node = cc.instantiate(this.aniSke);
          let widgt = node.getComponent(cc.Widget);
          widgt.destroy();
          let xy = GameManager.idxToXY(extraData.idx);

          let pos = new cc.Vec2(
            this.gameBoard.space * xy.x + 49,
            -this.gameBoard.space * xy.y - 49
          );
          this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
          this.node.parent.convertToNodeSpaceAR(pos, pos);

          node.x = pos.x;
          node.y = pos.y;
          this.node.parent.addChild(node);

          let ctrAni = node.getComponent(sp.Skeleton);
          let skeData = (await Utils.load(
            `切图/0动画/导出/道具/du`,
            sp.SkeletonData
          )) as sp.SkeletonData;
          ctrAni.skeletonData = skeData;
          ctrAni.setAnimation(999, "du2", false);
        });
        break;
      }
      case 3: {
        await this.usePropBase(
          flagExtraMove,
          color,
          "huojian",
          `huojian`,
          listAction,
          async e => {}
        );
        PromiseUtil.wait(45 / 30).then(async () => {
          let node = cc.instantiate(this.aniSke);
          let widgt = node.getComponent(cc.Widget);
          widgt.destroy();
          let xy = { x: 3, y: 2 };

          let pos = new cc.Vec2(
            this.gameBoard.space * xy.x + 49,
            -this.gameBoard.space * xy.y - 49
          );
          this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
          this.node.parent.convertToNodeSpaceAR(pos, pos);

          node.x = pos.x;
          node.y = pos.y;
          this.node.parent.addChild(node);

          let ctrAni = node.getComponent(sp.Skeleton);
          let skeData = (await Utils.load(
            `切图/0动画/导出/道具/huojian`,
            sp.SkeletonData
          )) as sp.SkeletonData;
          ctrAni.skeletonData = skeData;
          ctrAni.setAnimation(999, "luodi", false);
        });

        PromiseUtil.wait(54 / 30).then(async () => {
          let node = cc.instantiate(this.aniSke);
          let widgt = node.getComponent(cc.Widget);
          widgt.destroy();
          let xy = { x: 3, y: 2 };

          let pos = new cc.Vec2(
            this.gameBoard.space * xy.x + 49,
            -this.gameBoard.space * xy.y - 49
          );
          this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
          this.node.parent.convertToNodeSpaceAR(pos, pos);

          node.x = pos.x;
          node.y = pos.y;
          this.node.parent.addChild(node);

          let ctrAni = node.getComponent(sp.Skeleton);
          let skeData = (await Utils.load(
            `切图/0动画/导出/道具/huojian`,
            sp.SkeletonData
          )) as sp.SkeletonData;
          ctrAni.skeletonData = skeData;
          ctrAni.setAnimation(999, "baozha", false);
        });
        break;
      }
      case 4: {
        this.toggleShape(true);
        this.ani.node.active = true;
        let data = (await Utils.load(
          `切图/0动画/导出/道具/maozi`,
          sp.SkeletonData
        )) as sp.SkeletonData;
        this.ani.skeletonData = data;
        this.ani.setCompleteListener(async e => {
          this.ani.setCompleteListener(e => {});
          await this.gameBoard.showCrashByServer(listAction, color);
          if (flagExtraMove) {
            this.gameBoard.playExtra(color);
          }
          this.toggleShape(false);
          this.ani.node.active = false;
        });
        this.ani.setAnimation(1, `maozi`, false);

        let listDelay = [49, 62 - 49, 75 - 62];
        for (let i = 0; i < extraData.listChange.length; i++) {
          await PromiseUtil.wait(listDelay[i] / 30);
          let changeGroup = extraData.listChange[i];
          let idx = changeGroup[0];
          let xy = GameManager.idxToXY(idx);
          let pos = new cc.Vec2(
            this.gameBoard.space * xy.x + 49,
            -this.gameBoard.space * xy.y - 49
          );
          this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
          this.node.parent.convertToNodeSpaceAR(pos, pos);
          let spGrid = cc.instantiate(this.prefabGrid);
          let ctr = spGrid.getComponent(GameGrid);
          ctr.type = changeGroup[1];
          ctr.showIcon();

          let light = cc.instantiate(this.lightMaozi);

          let pos1 = new cc.Vec2(-84, 358);
          this.node.convertToWorldSpaceAR(pos1, pos1);
          this.node.parent.convertToNodeSpaceAR(pos1, pos1);
          let pos2 = new cc.Vec2(100, 450);
          this.node.convertToWorldSpaceAR(pos2, pos2);
          this.node.parent.convertToNodeSpaceAR(pos2, pos2);

          spGrid.x = pos1.x;
          spGrid.y = pos1.y;
          light.x = pos1.x;
          light.y = pos1.y;
          this.node.parent.addChild(light);
          this.node.parent.addChild(spGrid);

          let getAction = () => {
            return cc.bezierTo(30 / 30, [
              cc.v2(pos2.x, pos2.y),
              cc.v2(pos.x + 200, pos2.y + 100),
              pos
            ]);
          };

          light.runAction(getAction());
          spGrid.runAction(getAction());

          cc.tween(spGrid)
            .to(7 / 30, {
              scale: 1.5
            })
            .to((30 - 7) / 30, {
              scale: 1
            })
            .start();
          PromiseUtil.wait(30 / 30).then(async () => {
            spGrid.angle = 90;
            cc.tween(spGrid)
              .to(7 / 30, {
                scale: 1,
                angle: -15
              })
              .to((12 - 7) / 30, {
                scale: 1,
                angle: 0
              })
              .call(e => {
                spGrid.destroy();
                light.destroy();

                EventManager.emit("game/changeGridColor", {
                  showLight: true,
                  idx,
                  color: changeGroup[1]
                });
              })
              .start();
          });
        }
        break;
      }
      case 5: {
        PromiseUtil.wait(0.3).then(e => {
          AudioPlayer.playEffectByUrl("sound/道具音效2-鸭子");
        });
        await this.usePropBase(
          flagExtraMove,
          color,
          "yazi",
          `yazi`,
          listAction
        );
        break;
      }
      case 6: {
        AudioPlayer.playEffectByUrl("sound/道具音效3-油漆桶道具");
        // 根据
        this.usePropBase(
          flagExtraMove,
          color,
          "youqi",
          `youqi${extraData.targetColor}`,
          listAction,
          async e => {}
        );
        PromiseUtil.wait(47 / 30).then(async () => {
          this.doAfterProp6(extraData);
        });
        break;
      }
    }
  }
  // 油漆桶
  async doAfterProp6(extraData) {
    let aniYQ: cc.Node[] = [];
    let aniGrid: cc.Node[] = [];

    PromiseUtil.wait((100 - 47) / 30).then(e => {
      aniYQ.forEach((node: cc.Node, i) => {
        cc.tween(node)
          .delay((3 / 30) * i)
          .to(15 / 30, { opacity: 0 })
          .call(() => {
            node.destroy();
          })
          .start();
      });
      aniGrid.forEach((node: cc.Node, i) => {
        cc.tween(node)
          .delay((3 / 30) * i)
          .to(15 / 30, { opacity: 0 })
          .call(() => {
            node.destroy();
          })
          .start();
      });
    });
    // 在目标位置显示颜色
    for (let i = 0; i < extraData.listChangeColor.length; i++) {
      let idx = extraData.listChangeColor[i];
      let xy = GameManager.idxToXY(idx);

      let node = cc.instantiate(this.aniSke);
      let widgt = node.getComponent(cc.Widget);
      widgt.destroy();
      let pos = new cc.Vec2(
        this.gameBoard.space * xy.x + 49,
        -this.gameBoard.space * xy.y - 49
      );
      this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
      this.node.parent.convertToNodeSpaceAR(pos, pos);
      node.x = pos.x;
      node.y = pos.y;
      this.node.parent.addChild(node);
      let ctrAni = node.getComponent(sp.Skeleton);
      let skeData = (await Utils.load(
        `切图/0动画/导出/道具/youqi`,
        sp.SkeletonData
      )) as sp.SkeletonData;
      ctrAni.skeletonData = skeData;
      ctrAni.setAnimation(999, "reng" + extraData.targetColor, false);
      PromiseUtil.wait(6 / 30).then(() => {
        ctrAni.setAnimation(999, "zha" + extraData.targetColor, false);
      });
      aniYQ.push(ctrAni.node);

      let spGrid = cc.instantiate(this.prefabGrid);
      spGrid.opacity = 0;
      let ctr = spGrid.getComponent(GameGrid);
      ctr.type = extraData.targetColor;
      ctr.showIcon();
      spGrid.x = pos.x;
      spGrid.y = pos.y;
      this.node.parent.addChild(spGrid);
      aniGrid.push(spGrid);

      EventManager.emit("game/changeGridColor", {
        showLight: false,
        idx,
        color: extraData.targetColor
      });
      cc.tween(spGrid)
        .set({
          angle: 90,
          scale: 1.2,
          opacity: 255
        })
        .to(0.3, {
          angle: 0,
          scale: 1
        })
        .start();
      await PromiseUtil.wait(9 / 30);
    }
    // 更新棋盘
    GameManager.listData = extraData.listData;
    return aniYQ;
  }
  async playAni(skeName, aniName) {
    return new Promise(async rsv => {
      let node = cc.instantiate(this.aniSke);
      this.node.parent.addChild(node);
      let ctrAni = node.getComponent(sp.Skeleton);
      let skeData = (await Utils.load(
        `切图/0动画/导出/道具/${skeName}`,
        sp.SkeletonData
      )) as sp.SkeletonData;
      ctrAni.skeletonData = skeData;
      ctrAni.setCompleteListener(e => {
        node.destroy();
        rsv(null);
      });
      ctrAni.setAnimation(999, aniName, false);
    });
  }
  start() {
    this.shape.opacity = 0;
    this.ani.node.active = false;
    this.listen();
  }

  onDestroy() {
    EventManager.remove("game/toggleGameMask");
    EventManager.remove("game/chuizi_qiao");
  }
  toggleShape(flag) {
    this.shape.stopAllActions();
    cc.tween(this.shape)
      .to(15 / 30, {
        opacity: flag ? 255 : 0
      })
      .start();
  }
  listen() {
    EventManager.on("game/toggleGameMask", ({ flag }) => {
      this.toggleShape(flag);
    });
    EventManager.on("game/chuizi_qiao", async ({ idx }) => {
      let xy = GameManager.idxToXY(idx);

      let node = cc.instantiate(this.aniSke);
      let widgt = node.getComponent(cc.Widget);
      widgt.destroy();
      let pos = new cc.Vec2(
        this.gameBoard.space * xy.x + 49,
        -this.gameBoard.space * xy.y - 49
      );
      this.gameBoard.node.convertToWorldSpaceAR(pos, pos);
      this.node.parent.convertToNodeSpaceAR(pos, pos);
      node.x = pos.x;
      node.y = pos.y;
      this.node.parent.addChild(node);
      let ctrAni = node.getComponent(sp.Skeleton);
      let skeData = (await Utils.load(
        `切图/0动画/导出/技能/jineng`,
        sp.SkeletonData
      )) as sp.SkeletonData;
      ctrAni.skeletonData = skeData;
      ctrAni.setCompleteListener(e => {
        node.destroy();
      });
      ctrAni.setAnimation(999, "CZ", false);
    });
  }

  // update (dt) {}
}

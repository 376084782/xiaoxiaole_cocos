import GameManager from "../manager/GameManager";
import GameGrid from "./GameGrid";
import Utils from "../../commonScripts/utils/Utils";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import EventManager from "../../commonScripts/core/EventManager";
import _ = require("lodash");
import SocketManager from "../manager/SocketManager";
import MathUtil from "../../commonScripts/utils/MathUtil";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameBoard extends cc.Component {
  @property(cc.Node)
  areaTouch: cc.Node = null;

  @property(cc.Prefab)
  grid: cc.Prefab = null;

  @property(cc.Prefab)
  bgGrid: cc.Prefab = null;

  @property(cc.Prefab)
  aniXC: cc.Prefab = null;

  countW = 7;
  countH = 7;

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    GameManager.board = this;
    this.listen();
  }
  space = 0;

  listGrid: GameGrid[] = [];
  initBoard() {
    let eachW = this.node.width / this.countW;
    let eachH = this.node.height / this.countH;
    this.space = Math.min(eachH, eachW);

    this.resetBoard();
  }
  flagShuffling = false;

  // 道具-重排
  aniShuffle(listShuffled) {
    this.flagShuffling = true;

    // 记录老元素的序号
    let listSpOld = [];
    this.listGrid
      .filter(grid => grid.isAlive)
      .forEach((grid: GameGrid) => {
        listSpOld[grid.idx] = grid;
      });

    let duration = 1;
    listShuffled.forEach(([idxOld, idxNew]) => {
      let grid = listSpOld[idxOld];
      if (grid) {
        // 将元素的idx进行更新
        grid.idx = idxNew;
        // 先聚焦到中心一段区域后，再移动到新的目标位置
        let posCenter = {
          x: (1 + (6 - 1) * Math.random()) * this.space,
          y: (1 + (6 - 1) * Math.random()) * this.space
        };
        let posNew = GameManager.idxToXY(idxNew);
        cc.tween(grid.node)
          .delay(duration / 3)
          .to(duration / 3, {
            x: posCenter.x,
            y: -posCenter.y
          })
          .to(duration / 3, {
            x: posNew.x * this.space,
            y: -posNew.y * this.space
          })
          .start();
      } else {
        console.log(idxOld);
      }
    });

    this.scheduleOnce(e => {
      this.flagShuffling = false;
    }, duration);
  }
  lastShowAniRoud = 0;
  lastShowAniTurn = 0;
  // 棋盘初始化动画，从最右侧的列开始，挨个弹动效果
  aniShow() {
    if (
      this.lastShowAniRoud == SocketManager.matchInfo.round &&
      this.lastShowAniTurn == SocketManager.matchInfo.turn
    ) {
      return;
    }
    this.lastShowAniRoud = SocketManager.matchInfo.round;
    this.lastShowAniTurn = SocketManager.matchInfo.turn;
    for (let x = 0; x < this.countW; x++) {
      for (let y = 0; y < this.countH; y++) {
        let idx = y * this.countW + x;
        let grid = this.findGrid(idx);
        if (grid) {
          let ix = SocketManager.powerSeat == 1 ? x : this.countW - x;
          PromiseUtil.wait(ix * 0.04 + y * 0.01).then(e => {
            grid.showIcon();
          });
        }
      }
    }
  }
  resetBoard() {
    this.node.removeAllChildren();
    this.listGrid = [];
    GameManager.listData.forEach((row: number[], y) => {
      row.forEach((grid, x) => {
        let sp = cc.instantiate(this.bgGrid);
        sp.x = this.space * x;
        sp.y = -this.space * y;
        this.node.addChild(sp);
        let isDark = y % 2 == 0 ? x % 2 == 0 : x % 2 != 0;
        let img = sp.getComponent(cc.Sprite);
        Utils.setSpImg(
          img,
          `切图/${!SocketManager.isMatch ? "4主界面" : "4主界面-比赛"
          }/图标底框-${isDark ? "深" : "浅"}`
        );
      });
    });

    GameManager.listData.forEach((row: number[], y) => {
      row.forEach((grid, x) => {
        let sp = cc.instantiate(this.grid);
        sp.x = this.space * x;
        sp.y = -this.space * y;
        let ctr = sp.getComponent(GameGrid);
        ctr.type = grid;
        ctr.idx = GameManager.xyToIdx(x, y);
        this.node.addChild(sp);
        this.listGrid.push(ctr);
      });
    });
  }

  onDestroy() {
    console.log('destroy');
    EventManager.remove("game/changeGridColor");
    EventManager.remove("game/crash");
    EventManager.remove("game/shuffle");
  }
  listen() {
    this.listenGameAreaTouch();
    EventManager.on("game/changeGridColor", ({ idx, color, showLight }) => {
      let grid = this.findGrid(idx);
      grid.type = color;
      if (showLight) {
        grid.toggleLight(true);
      }
      grid.showIcon();
    });
    EventManager.on("game/crash", async e => {
      await this.showCrashByServer(e.crashList, e.seat);
    });
    EventManager.on("game/shuffle", e => {
      this.aniShuffle(e.listShuffle);
    });
  }
  // 游戏棋盘滑动的监听
  listenGameAreaTouch() {
    let posXY: { x; y };
    let posStart: { x; y };
    let offset = 70;

    this.areaTouch.on(
      cc.Node.EventType.TOUCH_START,
      (e: cc.Event.EventTouch) => {
        if (SocketManager.powerSeat != 1) {
          return;
        }
        let pos = e.getLocation();
        this.node.convertToNodeSpaceAR(pos, pos);
        posStart = pos;
        posXY = this.getIdxByPos(pos);
        let flagInside = GameManager.checkInside(posXY.x, posXY.y);
        if (flagInside) {
          let ctr = this.findGrid(GameManager.xyToIdx(posXY.x, posXY.y));
          ctr.showIcon();
        }
      }
    );
    this.areaTouch.on(cc.Node.EventType.TOUCH_END, e => {
      if (SocketManager.powerSeat != 1) {
        return;
      }

      let pos = e.getLocation();
      this.node.convertToNodeSpaceAR(pos, pos);
      let idxStart = GameManager.xyToIdx(posXY.x, posXY.y);
      let posEndXY = { x: posXY.x, y: posXY.y };
      let flagEndInside = GameManager.checkInside(posEndXY.x, posEndXY.y);

      if (GameManager.flagSelecting) {
        let posQiao = this.getIdxByPos(pos);
        let flagEndInside = GameManager.checkInside(posQiao.x, posQiao.y);
        if (flagEndInside) {
          // 敲
          let idx = GameManager.xyToIdx(posQiao.x, posQiao.y);
          SocketManager.sendMessage("DO_CHUIZI", { idx: idx });
        } else {
          EventManager.emit("game/chuizi_cancel", {});
        }
        return;
      }
    });
    this.areaTouch.on(
      cc.Node.EventType.TOUCH_MOVE,
      async (e: cc.Event.EventTouch) => {
        if (SocketManager.powerSeat != 1) {
          console.log('powerSeat,', 'cecececece')
          return;
        }
        if (GameManager.flagCrashing) {
          console.log('flagCrashing', 'cecececece')
          return;
        }

        let pos = e.getLocation();
        this.node.convertToNodeSpaceAR(pos, pos);
        let idxStart = GameManager.xyToIdx(posXY.x, posXY.y);
        let xyEnd = this.getIdxByPos(pos);
        let idxEnd = GameManager.xyToIdx(xyEnd.x, xyEnd.y);
        let flagEndInside = GameManager.checkInside(xyEnd.x, xyEnd.y);

        if (!flagEndInside || idxEnd == idxStart) {
          console.log(flagEndInside, idxEnd, idxStart, "cecececece");
          return;
        }

        let absX = Math.abs(pos.x - posStart.x);
        let absY = Math.abs(pos.y - posStart.y);
        if (absX > absY) {
          if (pos.x - posStart.x > 0) {
            posXY.x++;
          } else if (pos.x - posStart.x < 0) {
            posXY.x--;
          }
        } else {
          if (pos.y - posStart.y < 0) {
            posXY.y++;
          } else if (pos.y - posStart.y > 0) {
            posXY.y--;
          }
        }
        let idxNew = GameManager.xyToIdx(posXY.x, posXY.y);
        let flagNewInside = GameManager.checkInside(posXY.x, posXY.y);
        if (!flagNewInside) {
          console.log(flagNewInside, "flagNewInside", 'cecececece');
          return;
        }
        console.log("谁换", idxStart, idxNew);
        let { flagNextTurn, listAction } = GameManager.getMoveData(
          idxStart,
          idxNew
        );
        // if (!flagNextTurn) {
        //   this.showCrashByServer(listAction, SocketManager.selfColor);
        // } else {
        // }
        SocketManager.sendMessage("DO_MOVE", {
          idx1: idxStart,
          idx2: idxNew
        });
      }
    );
  }
  playExtra(seat) {
    AudioPlayer.playEffectByUrl("sound/连消四个播报音效");
    let color = SocketManager.colorSTC(seat);
    this.aniZi.setBonesToSetupPose();
    this.aniZi.setAnimation(1, "ex_" + (color == 1 ? "L" : "H"), false);
  }
  findGrid(grid) {
    return this.listGrid.find(
      (ctr: GameGrid) => ctr.isAlive && ctr.idx == grid
    );
  }

  @property(sp.Skeleton)
  aniZi: sp.Skeleton = null;

  @property(cc.Prefab)
  prefabHand: cc.Prefab = null;

  async showCrashByServer(listAction, seat) {
    this.listGrid = this.listGrid.filter((ctr: GameGrid) => ctr.isAlive);
    let time1 = new Date().getTime();
    GameManager.flagCrashing = true;
    let flagShowBubble = false;
    let flagExtraShowed = false;
    for (let i = 0; i < listAction.length; i++) {
      let { action, data } = listAction[i];
      if (action == "exchange" || action == "exchange_back") {
        let timeDelayChange = 8 / 30;
        AudioPlayer.playEffectByUrl("sound/滑动方块");

        if (action == "exchange") {
          // 添加一个手，播放移动的动画
          let spHand = cc.instantiate(this.prefabHand);
          let posStartXY = GameManager.idxToXY(data[0][0]);
          let posEndXY = GameManager.idxToXY(data[0][1]);
          this.node.addChild(spHand);
          cc.tween(spHand)
            .set({
              x: posStartXY.x * this.space + 49,
              y: -posStartXY.y * this.space - 49
            })
            .to(timeDelayChange, {
              x: posEndXY.x * this.space + 49,
              y: -posEndXY.y * this.space - 49
            })
            .call(() => {
              spHand.destroy();
            })
            .start();
        }

        let ffDoExchange = async (target, idxTo) => {
          if (target) {
            target.showIcon();
            let posEndXY = GameManager.idxToXY(idxTo);
            target.idx = idxTo;
            cc.tween(target.node)
              .to(timeDelayChange, {
                x: posEndXY.x * this.space,
                y: -posEndXY.y * this.space
              })
              .start();

            await PromiseUtil.wait(timeDelayChange);
          }
        };
        let gridChang1 = this.findGrid(data[0][0]);
        let gridChang2 = this.findGrid(data[1][0]);
        ffDoExchange(gridChang1, data[0][1]);
        await ffDoExchange(gridChang2, data[1][1]);
      } else if (action == "crash") {
        let {
          listWillDel,
          dataDelBySpecialGrid,
          listWillChange,
          listFall,
          userData,
          flagExtraMove
        } = data;
        if (!flagShowBubble) {
          flagShowBubble = true;
          EventManager.emit("showScoreToTotal", {
            seat,
            scoreAdd: listWillDel.length
          });
        }

        // 播放特殊动画
        dataDelBySpecialGrid.listAni.forEach(async conf => {
          if (conf.type <= 200) {
            let node = cc.instantiate(this.aniXC);
            let ctrAni = node.getComponent(sp.Skeleton);
            node.x = conf.xy.x * this.space + 49;
            node.y = -conf.xy.y * this.space - 49;
            this.node.addChild(node);
            ctrAni.setAnimation(
              1,
              `xiaochu_${conf.type == 100 ? "heng" : "shu"}`,
              false
            );
            PromiseUtil.wait(.5).then(e => {
              node.destroy();
            });
          } else if (conf.type == 400) {
            // 闪电
            conf.listDel.forEach(async gridDel => {
              let node = cc.instantiate(this.aniXC);
              let ctrAni = node.getComponent(sp.Skeleton);
              let dataSke = (await Utils.load(
                `切图/0动画/导出/道具/maozi`,
                sp.SkeletonData
              )) as sp.SkeletonData;
              ctrAni.skeletonData = dataSke;

              let posStart = cc.v2(
                conf.xy.x * this.space + 49,
                -conf.xy.y * this.space - 49
              );
              node.x = posStart.x;
              node.y = posStart.y;
              this.node.addChild(node);

              let xyEnd = GameManager.idxToXY(gridDel);
              let posEnd = new cc.Vec2(
                xyEnd.x * this.space + 49,
                -xyEnd.y * this.space - 49
              );

              let angle = MathUtil.getAngle(posStart, posEnd);
              node.angle = (180 * angle) / Math.PI;
              node.scaleX =
                MathUtil.getDistance(
                  cc.v2(xyEnd.x, xyEnd.y),
                  cc.v2(conf.xy.x, conf.xy.y)
                ) / 6;
              ctrAni.setAnimation(1, `shandian_C`, true);
              PromiseUtil.wait(.5).then(e => {
                node.destroy();
              });
            });
          }
        });
        listWillDel.forEach((grid, idx) => {
          let target = this.findGrid(grid);
          if (!target) {
            console.log("少目标炸", i, grid);
            return;
          }
          target.doDismiss();
          let pos = target.node.convertToWorldSpaceAR(
            cc.v2(target.node.width / 2, -target.node.height / 2)
          );
          PromiseUtil.wait((6 / 30) * ((idx % 3) + Math.random())).then(e => {
            GameManager.doAddLight({
              seat,
              pos: pos
            });
          });
        });

        if (listWillDel.length > 0) {
          await PromiseUtil.wait(8 / 30);
        }
        if (!flagExtraShowed) {
          if (flagExtraMove) {
            this.playExtra(seat);
            flagExtraShowed = true;
          }
        }

        // 在目标位置生成特殊道具，炸弹或者箭头
        listWillChange.forEach(conf => {
          let xy = GameManager.idxToXY(conf.idx);
          let sp = cc.instantiate(this.grid);
          let gridTarget = sp.getComponent(GameGrid);
          gridTarget.type = conf.value;
          sp.x = xy.x * this.space;
          sp.y = -xy.y * this.space;
          gridTarget.idx = conf.idx;
          this.node.addChild(sp);
          this.listGrid.push(gridTarget);
        });

        let durationFall = 10 / 30;
        listFall.forEach(({ idxTo, idxFrom, color, isNew, posFrom }) => {
          let gridTarget = this.findGrid(idxFrom);
          let xyFrom = GameManager.idxToXY(idxFrom);
          let xyTo = GameManager.idxToXY(idxTo);
          if (isNew) {
            let sp = cc.instantiate(this.grid);
            gridTarget = sp.getComponent(GameGrid);
            gridTarget.type = color;
            sp.x = xyTo.x * this.space;
            sp.y = -posFrom.y * this.space;
            this.node.addChild(sp);
            xyFrom = posFrom;
            gridTarget.idx = idxTo;
            this.listGrid.push(gridTarget);
          }
          if (gridTarget) {
            // if (gridTarget.type != color) {
            //   gridTarget.type = color;
            //   gridTarget.showIcon();
            //   console.log("修正颜色");
            // }
            let objTo = {
              x: xyTo.x * this.space,
              y: -xyTo.y * this.space
            };
            gridTarget.idx = idxTo;
            cc.tween(gridTarget.node)
              .to(durationFall, objTo, { easing: "quadInOut" })
              .start();
          } else {
            console.log(idxFrom, posFrom);
          }
        });

        EventManager.emit("game/updateSkillPrg", {
          seat: seat,
          skillPrg: userData.skillPrg
        });
        if (listFall.length > 0) {
          await PromiseUtil.wait(durationFall);
        }
      }
    }

    await PromiseUtil.wait(30 / 30);
    EventManager.emit("doAddScoreToTotal", {
      seat,
      finalScore:
        seat == 1
          ? SocketManager.matchInfo.data1.score
          : SocketManager.matchInfo.data2.score
    });
    await PromiseUtil.wait(6 / 30);
    GameManager.flagCrashing = false;
  }
  getIdxByPos(pos: cc.Vec2) {
    let x = Math.floor(pos.x / this.space);
    let y = Math.floor(-pos.y / this.space);
    return { x, y };
  }

  // update (dt) {}
}

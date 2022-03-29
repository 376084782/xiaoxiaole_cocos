import MathUtil from "../../commonScripts/utils/MathUtil";
import _ = require("lodash");
import EventManager from "../../commonScripts/core/EventManager";
import GameConfig from "../config/GameConfig";
import Utils from "../../commonScripts/utils/Utils";
import SocketManager from "./SocketManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";

export default class GameManager {
  static doBack(type) {
    if (SocketManager.equipment == 2) {
      console.log("点击返回equipment2");
      window["uni"].postMessage({
        data: {
          action: type // 这是传的参数
        }
      });
    } else {
      console.log("点击返回equipment其他");
      history.go(-1);
      return;
      if (navigator.userAgent.indexOf("MSIE") > 0) {
        // close IE
        if (navigator.userAgent.indexOf("MSIE 6.0") > 0) {
          window.opener = null;
          window.close();
        } else {
          window.open("", "_top");
          window.top.close();
        }
      } else {
        // close chrome;It is effective when it is only one.
        window.opener = null;
        window.open("", "_self");
        window.close();
      }
    }
  }
  static flagCrashing = false;
  static board: any;
  static flagAddSkill = false;
  static doAddSkillLight({ seat, pos }) {
    let delay = 2 / 30;
    if (this.flagAddSkill) {
      PromiseUtil.wait(delay).then(e => {
        this.doAddSkillLight({ seat, pos });
      });
      return;
    }

    this.flagAddSkill = true;
    EventManager.emit("addScoreLight", { seat, pos });

    PromiseUtil.wait(delay).then(e => {
      this.flagAddSkill = false;
    });
  }

  static flagAddingLight = false;
  static doAddLight({ seat, pos }) {
    // let delay = 2 / 30;
    // if (this.flagAddingLight) {
    //   PromiseUtil.wait(delay).then(e => {
    //     this.doAddLight({ seat, pos });
    //   });
    //   return;
    // }

    // this.flagAddingLight = true;
    EventManager.emit("addScoreLight", { seat, pos });

    // PromiseUtil.wait(delay).then(e => {
    //   this.flagAddingLight = false;
    // });
  }

  static get isSelfWin() {
    let userSelf = SocketManager.selfData;
    let userOppo = SocketManager.oppoData;
    return userSelf.score > userOppo.score;
  }
  static loopCrash(listWillDel = []) {
    let res: any[] = this.checkMerge();
    let listWillChange = [];
    res.forEach(dataDismiss => {
      listWillDel = listWillDel.concat(dataDismiss.list);
      listWillChange = listWillChange.concat(dataDismiss.listChange);
    });

    let valsDeled = this.delGrids(listWillDel);
    let dataDelBySpecialGrid = this.checkSpecialGridDeleted();
    listWillDel = _.uniq(listWillDel.concat(dataDelBySpecialGrid.list));

    listWillChange.forEach(conf => {
      this.changeGrid(conf.idx, conf.value);
    });

    let listFall = this.checkFall();

    let isChanged =
      listWillChange.length > 0 ||
      listWillDel.length > 0 ||
      dataDelBySpecialGrid.list.length > 0 ||
      dataDelBySpecialGrid.listAni.length > 0 ||
      listFall.length > 0;

    return {
      isChanged,
      listWillChange,
      listWillDel,
      dataDelBySpecialGrid,
      listFall,
      flagExtraMove: !!res.find(e => e.flagExtraMove)
    };
  }
  static getMoveData(idx1, idx2) {
    let listAction = [];
    let resExchange = this.exchange(idx1, idx2);
    let flagNextTurn = true;
    if (resExchange) {
      listAction.push({
        action: "exchange",
        data: resExchange
      });
      while (true) {
        let dataCrash = this.loopCrash();
        if (!dataCrash.isChanged) {
          break;
        }

        listAction.push({
          action: "crash",
          data: dataCrash
        });
      }
      console.log(listAction, "listActionlistActionlistAction");
      if (listAction.length == 1) {
        flagNextTurn = false;
        let resExchangeBack = this.exchange(idx1, idx2);
        listAction.push({
          action: "exchange_back",
          data: resExchangeBack
        });
      }
    }
    return { flagNextTurn, listAction };
  }
  static playMusicSpecialX() { }
  static playMusicX() { }
  static flagSelecting = false;
  static wrapSkillStar: cc.Node;
  static skillPosL: cc.Vec2 = cc.v2(0, 0);
  static skillPosR: cc.Vec2 = cc.v2(0, 0);

  static async getToolList() {

    let data: any = await Utils.doAjax({
      url: "/shop",
      method: "post",
      data: {
        userId: Utils.getQueryVariable("userId")
      }
    });
    return data
  }
  static async updateCoin() {
    let data: any = await Utils.doAjax({
      url: "/getUserInfoById",
      method: "post",
      data: {
        userId: Utils.getQueryVariable("userId")
      }
    });
    // let data={
    //   gamepoint:1000,
    //   avatar:'',
    //   nickname:'asdsadadd'
    // }
    this.coin = data.gamepoint;
    SocketManager.userId = Utils.getQueryVariable("userId");
    SocketManager.userInfo = {
      score: data.gamepoint,
      avatar: data.avatar,
      sex: 1,
      nickname: data.nickname,
      uid: SocketManager.userId
    };
  }
  static coin = 0;
  static flagCanEnterMatch = true;
  static async doStartGame(propId) {
    if (!this.flagCanEnterMatch) {
      return;
    }
    this.flagCanEnterMatch = false;
    let propConf = GameConfig.propList.find(conf => conf.id == propId);
    if (propConf) {
      if (+SocketManager.lp + propConf.cost > this.coin) {
        Utils.showToast("金币不足");
        this.flagCanEnterMatch = true;
        return;
      }
    } else {
      Utils.showToast("道具非法");
      this.flagCanEnterMatch = true;
      return;
    }

    // 请求网络开始游戏
    SocketManager.sendMessage("MATCH", {
      matchId: SocketManager.matchId,
      flag: true,
      propId,
      isMatch: SocketManager.isMatch,
      type: SocketManager.type,
      lp: SocketManager.lp,
      roomId: SocketManager.roomId,
      withRobot: SocketManager.withRobot
    });
  }

  static _combo = 0;
  static set combo(combo) {
    this._combo = combo;
    if (combo > 1) {
      EventManager.emit("showCombo", combo);
    }
  }
  static get combo() {
    return this._combo;
  }
  static lastCombo = 0;

  static _score = 0;
  static set score(score) {
    this._score = score;
    EventManager.emit("updateScore");
  }
  static get score() {
    return this._score;
  }

  static listData: number[][] = [];
  static initGame() {
    // 随机算法细节：不应在初始化时直接形成已构成三连的地图
    // 查询上一个宝石的向左和向上的位置
    // 是否已经构成二连，如果已构成，需要排除该颜色后进行随机
    for (let m = 0; m < 7; m++) {
      this.listData[m] = [];
      for (let n = 0; n < 7; n++) {
        let colorLeft = -1;
        let colorTop = -1;
        if (n >= 1) {
          // 查询左侧的格子颜色
          colorLeft = this.listData[m][n - 1];
        }
        if (m >= 1) {
          // 查询上侧的格子颜色
          colorTop = this.listData[m - 1][n];
        }
        let listColor = [1, 2, 3, 4, 5, 6].filter(
          color => color != colorLeft && color != colorTop
        );

        let randomIdx = MathUtil.getRandomInt(0, listColor.length);
        this.listData[m][n] = listColor[randomIdx];
      }
    }
  }
  static resetAll() {
    this.initGame();
    this.score = 0;
  }
  static getRandomNew(): { list1_back; listNew } {
    let list1 = [];
    this.listData.forEach((row: number[], y) => {
      row.forEach((grid: number, x) => {
        let idx = this.xyToIdx(x, y);
        list1[idx] = grid;
      });
    });

    let list1_back = _.cloneDeep(list1);
    let listNew = [];

    // 随机
    for (let m = 0; m < 7; m++) {
      listNew[m] = [];
      for (let n = 0; n < 7; n++) {
        let colorLeft = -1;
        let colorTop = -1;
        if (n >= 1) {
          // 查询左侧的格子颜色
          colorLeft = listNew[m][n - 1];
        }
        if (m >= 1) {
          // 查询上侧的格子颜色
          colorTop = listNew[m - 1][n];
        }
        let listColor = list1.filter(
          color => color != colorLeft && color != colorTop
        );
        if (listColor.length == 0) {
          // 无解，重算
          return this.getRandomNew();
        }

        let randomIdx = MathUtil.getRandomInt(0, listColor.length);

        listNew[m][n] = listColor[randomIdx];

        // 从list1里反查这个颜色，排除掉
        let idx2 = list1.findIndex(color => color == listColor[randomIdx]);
        list1.splice(idx2, 1);
      }
    }
    return { list1_back, listNew };
  }
  // shuffle
  static doShuffle() {
    // 得到新数组
    let { list1_back, listNew } = this.getRandomNew();
    let listIdxNew = [];
    listNew.forEach((row: number[], y) => {
      row.forEach((grid: number, x) => {
        let idx = this.xyToIdx(x, y);
        listIdxNew[idx] = grid;
      });
    });

    // 将老数据一一配对，得到乱序的动画起始结束的点
    let listShuffle = [];

    list1_back.forEach((color, idx) => {
      let listIdx = [];
      let endIdx = idx;
      listIdxNew.forEach((colorNew, idxNew) => {
        if (idxNew != idx && colorNew == color) {
          listIdx.push(idxNew);
        }
      });
      if (listIdx.length > 0) {
        let idx3 = MathUtil.getRandomInt(0, listIdx.length);
        endIdx = listIdx[idx3];
      }
      // 将endIdx对应的颜色置空，防止后续重复随机
      listIdxNew[endIdx] = -1;

      listShuffle.push([idx, endIdx]);
    });

    // 赋值新棋盘
    GameManager.listData = listNew;
    return listShuffle;
  }
  // 查询一侧相邻是否有元素
  static getNextGrid(idx: number, dir: number): number {
    let { x, y } = this.idxToXY(idx);
    switch (dir) {
      case 1: {
        y--;
        break;
      }
      case 2: {
        x++;
        break;
      }
      case 3: {
        y++;
        break;
      }
      case 4: {
        x--;
        break;
      }
    }
    return this.listData[y] && this.listData[y][x] && this.xyToIdx(x, y);
  }
  // idx=>x y
  static idxToXY(idx) {
    return {
      x: idx % GameConfig.col,
      y: Math.floor(idx / GameConfig.col)
    };
  }
  // xy=>idx
  static xyToIdx(x, y) {
    return y * GameConfig.col + x;
  }
  // 交换两个格子
  static exchange(idx1, idx2) {
    // 解构，交换顺序
    let pos1 = this.idxToXY(idx1);
    let pos2 = this.idxToXY(idx2);

    let val1 = this.listData[pos1.y][pos1.x];
    let val2 = this.listData[pos2.y][pos2.x];
    if (val1 == val2) {
      // 判断两个值如果相同，不交换
      return false;
    }
    [this.listData[pos1.y][pos1.x], this.listData[pos2.y][pos2.x]] = [
      this.listData[pos2.y][pos2.x],
      this.listData[pos1.y][pos1.x]
    ];
    return [
      [idx1, idx2],
      [idx2, idx1]
    ];
  }
  static getGridByXY(x, y) {
    return this.listData[y] && this.listData[y][x];
  }
  // 检查补满格子
  static checkFall() {
    let listMap = this.listData;
    let mapMove = [];
    let res = [];
    while (true) {
      mapMove = [];
      // 倒着进行查询
      let coutMap = {};
      for (let y = GameConfig.row - 1; y >= 0; y--) {
        for (let x = GameConfig.col - 1; x >= 0; x--) {
          let grid = listMap[y][x];
          if (grid == -1) {
            // 上面的格子掉下来填满
            let posPre = { x, y };
            let targetLev = 0;
            while (true) {
              posPre.y--;
              if (!listMap[posPre.y]) {
                // 上方没有格子了
                coutMap[x] = coutMap[x] || 0;
                coutMap[x]++;
                targetLev = MathUtil.getRandomInt(1, 6);
                mapMove.push({
                  idxTo: this.xyToIdx(x, y),
                  idxFrom: this.xyToIdx(x, y - 1) - 1000,
                  posFrom: { x, y: -coutMap[x] },
                  color: targetLev,
                  isNew: true
                });
                break;
              } else if (listMap[posPre.y][posPre.x] > -1) {
                // 找到格子
                targetLev = listMap[posPre.y][posPre.x];
                listMap[posPre.y][posPre.x] = -1;

                let conf = {
                  idxTo: this.xyToIdx(x, y),
                  idxFrom: this.xyToIdx(posPre.x, posPre.y),
                  posFrom: posPre,
                  color: targetLev,
                  isNew: false
                };
                let confCanMerge = mapMove.find(
                  conf2 => conf2.idxTo == conf.idxFrom
                );
                if (confCanMerge) {
                  confCanMerge.idxTo = conf.idxTo;
                } else {
                  mapMove.push(conf);
                }

                break;
              }
            }
            listMap[y][x] = targetLev;
          }
        }
      }
      // 相对上一次的移动进行合并操作

      if (mapMove.length == 0) {
        break;
      }
      res = res.concat(mapMove);
    }

    return res;
  }
  static checkMerge() {
    let map = [];
    let flagExtraMove = false;
    this.listData.forEach((row, y) => {
      row.forEach((grid, x) => {
        let idx = this.xyToIdx(x, y);
        let list = map.find(({ color, list }) => {
          return list.indexOf(idx) > -1;
        });
        if (!list) {
          let listLinked = this.findLinkedList(idx);
          let flagMoreThan3 = this.isMoreThanInLine(3, listLinked);
          if (flagMoreThan3) {
            let listChange = [];
            // 相连五个以上，生成炸弹
            let flagMoreThan5 = listLinked.length >= 5;
            if (flagMoreThan5) {
              flagExtraMove = true;
              listChange.push({ idx, value: 300 + grid });
            } else {
              // 相连四个以上，生成箭头
              let flagMoreThan4X = this.isMoreThanInX(4, listLinked);
              if (flagMoreThan4X) {
                flagExtraMove = true;
                listChange.push({ idx, value: 200 + grid });
              } else {
                let flagMoreThan4Y = this.isMoreThanInY(4, listLinked);
                if (flagMoreThan4Y) {
                  flagExtraMove = true;
                  listChange.push({ idx, value: 100 + grid });
                }
              }
            }

            map.push({
              color: this.listData[y][x],
              list: listLinked,
              listChange,
              flagExtraMove
            });
          }
        }
      });
    });

    return map;
  }
  static isMoreThanInX(count, list) {
    return !!list.find(grid1 => {
      let xy1 = this.idxToXY(grid1);
      return (
        list.filter(grid => {
          let xy = this.idxToXY(grid);
          return xy.y == xy1.y;
        }).length >= count
      );
    });
  }
  static isMoreThanInY(count, list) {
    return !!list.find(grid1 => {
      let xy1 = this.idxToXY(grid1);
      return (
        list.filter(grid => {
          let xy = this.idxToXY(grid);
          return xy.x == xy1.x;
        }).length >= count
      );
    });
  }
  static isMoreThanInLine(count, list) {
    // x轴上是否有三个以上相连
    let flagMoreThanInX = this.isMoreThanInX(count, list);
    // y轴上是否有三个以上相连
    let flagMoreThanInY = this.isMoreThanInY(count, list);
    let flagMoreThan3 = flagMoreThanInX || flagMoreThanInY;
    return flagMoreThan3;
  }
  static delGrids(list) {
    list.forEach(idx => {
      this.delGrid(idx);
    });
  }
  static changeGrid(idx, value) {
    let xy = this.idxToXY(idx);
    this.listData[xy.y][xy.x] = value;
  }
  static getColor(x, y) {
    return this.listData[y][x] % 100;
  }
  static findLinkedList(idx, dirList = [1, 2, 3, 4], list?: number[]) {
    let xy = this.idxToXY(idx);
    let color = this.getColor(xy.x, xy.y);
    if (!list) {
      list = [idx];
    }

    let findByDir = dir => {
      let xy1 = { x: xy.x, y: xy.y };
      let dirList = [];
      switch (dir) {
        case 1: {
          xy1.y--;
          dirList = [1, 2, 4];
          break;
        }
        case 2: {
          xy1.x++;
          dirList = [1, 2, 3];

          break;
        }
        case 3: {
          xy1.y++;
          dirList = [4, 2, 3];

          break;
        }
        case 4: {
          xy1.x--;
          dirList = [1, 4, 3];
          break;
        }
      }
      if (
        xy1.x >= 0 &&
        xy1.x < GameConfig.col &&
        xy1.y >= 0 &&
        xy1.y < GameConfig.row
      ) {
        if (this.getColor(xy1.x, xy1.y) == color) {
          let idx = this.xyToIdx(xy1.x, xy1.y);
          if (list.indexOf(idx) == -1) {
            list.push(idx);
            list = _.uniq(list.concat(this.findLinkedList(idx, dirList, list)));
          }
        }
      }
      return list;
    };

    dirList.forEach(dir => {
      findByDir(dir);
    });

    return list;
  }
  static lastDelList = [];
  static delGrid(idx) {
    let pos = this.idxToXY(idx);
    this.lastDelList.push({
      idx,
      value: +this.listData[pos.y][pos.x]
    });
    this.listData[pos.y][pos.x] = -1;
  }
  // 检查最后删除的元素是否触发了箭头或者炸弹
  static checkSpecialGridDeleted() {
    let list = [];
    let listAni = [];
    this.lastDelList.forEach(data => {
      let xy = this.idxToXY(data.idx);
      if (data.value > 100) {
        // 特殊道具，进行额外消除操作
        if (data.value > 300) {
          for (let y = 0; y < 7; y++) {
            list.push(this.xyToIdx(xy.x, y));
          }
          for (let x = 0; x < 7; x++) {
            list.push(this.xyToIdx(x, xy.y));
          }
          listAni.push({
            type: 100,
            xy
          });
          listAni.push({
            type: 200,
            xy
          });
        } else if (data.value > 200) {
          // y轴消除
          for (let y = 0; y < 7; y++) {
            list.push(this.xyToIdx(xy.x, y));
          }
          listAni.push({
            type: 200,
            xy
          });
        } else {
          // x轴消除
          for (let x = 0; x < 7; x++) {
            list.push(this.xyToIdx(x, xy.y));
          }
          listAni.push({
            type: 100,
            xy
          });
        }
      }
    });
    this.delGrids(list);
    this.lastDelList = [];
    return { list, listAni };
  }
  static setGrid(idx, level) {
    let pos = this.idxToXY(idx);
    this.listData[pos.y][pos.x] = level;
  }
  static checkInside(x, y) {
    return this.listData[y] && this.listData[y][x];
  }
}
window["GameManager"] = GameManager;

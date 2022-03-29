import Utils from "../../commonScripts/utils/Utils";
import SceneNavigator from "../../commonScripts/core/SceneNavigator";
import PopupManager from "../../commonScripts/core/PopupManager";
import GameManager from "./GameManager";
import EventManager from "../../commonScripts/core/EventManager";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

export default class SocketManager {
  static equipment = 1;
  static orderMap = {};
  static isMatch = false;
  static matchId = 0;
  static roomId = 0;
  static withRobot = false
  static type = 0;
  static lp = 0;

  static get io() {
    return window["io"];
  }
  static socket;
  static listen() {
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("message", this.onMessage.bind(this));
  }
  static lastRankInfo: any = {};
  static async onMessage(res) {
    let type = res.type;
    let data = res.data;
    console.log(res, "收到服务端消息");
    switch (type) {
      case "RECONNECT": {
        SocketManager.isMatch = data.dataGame.isMatch;
        if (data.dataGame.isMatch) {
          if (!data.dataGame.isInRoom) {
            // 请求加入比赛
            AudioPlayer.playMusicByUrl("sound/大厅bgm-完美循环");
            PopupManager.show("modal/ModalTool");
          } else {
            SocketManager.lastRankInfo = data.dataGame.rankInfo;
            if (data.dataGame.gameInfo && !data.dataGame.gameInfo.isFinish) {
              PopupManager.show("modal/ModalRank", { index: -1 });
              this.setGameData(data.dataGame.gameInfo);
              PopupManager.show("modal/ModalGame", { isReconnect: true });
            } else {
              PopupManager.show("modal/ModalRank", {});
            }
          }
        } else {
          if (!data.dataGame.isInRoom) {
            // 未开始游戏，进入选择道具界面
            AudioPlayer.playMusicByUrl("sound/大厅bgm-完美循环");
            PopupManager.show("modal/ModalTool");
          } else {
            if (!data.dataGame.isStarted) {
              PopupManager.show("modal/ModalMatch", {
                userInfo: SocketManager.userInfo
              });
            } else {
              // 进重连
              this.setGameData(data.dataGame.gameInfo);
              PopupManager.show("modal/ModalGame", { isReconnect: true });
            }
          }
        }
        break;
      }
      case "RANK_RESULT": {
        location.href = `${Utils.host}/#/pages/pos/game/startGame/victory?isVictory=${data.rank}&number=1&orderId=${data.orderId}`;
        break;
      }
      case "RANK_ENTER": {
        PopupManager.show("modal/ModalRank");
        break;
      }
      case "SHOW_MATCH_ENTER": {
        let { flag } = data;
        if (flag) {
          // 进入匹配
          PopupManager.show("modal/ModalMatch", { userInfo: data.userInfo });
        } else {
          GameManager.flagCanEnterMatch = true;

          EventManager.removeAll();
          PopupManager.clearAllModal();
          PopupManager.show("modal/ModalTool");
          AudioPlayer.stopAllMusic();
          AudioPlayer.playMusicByUrl("sound/大厅bgm-完美循环");
        }
        break;
      }
      case "MOVE": {
        EventManager.emit("game/toggleTimer", false);
        this.setGameData(data.gameInfo);
        EventManager.emit("game/crash", data);
        break;
      }
      case "GAME_CHANGE_POWER": {
        EventManager.emit("game/toggleTimer", true);
        console.log(
          "time",
          SocketManager.matchInfo.timeNextStep - data.gameInfo.timeNextStep
        );
        this.setGameData(data.gameInfo);
        EventManager.emit("game/goNextRound");
        EventManager.emit("game/chuizi_cancel");
        break;
      }
      case "USE_PROP": {
        EventManager.emit("game/toggleTimer", false);
        this.setGameData(data.gameInfo);
        EventManager.emit("game/useProp", data);
        break;
      }
      case "SHOW_MATCH_SUCCESS": {
        AudioPlayer.stopAllMusic();
        PopupManager.show("modal/ModalGame", { index: -1 });
        EventManager.emit(
          "game/matched",
          data.userList.find(e => e.uid != SocketManager.userInfo.uid)
        );
        break;
      }
      case "DO_CHUIZI": {
        //等待动画
        EventManager.emit("game/toggleTimer", false);
        this.setGameData(data.gameInfo);
        EventManager.emit("game/toggleGameMask", { flag: true });
        AudioPlayer.playEffectByUrl("sound/下方道具锤击音效");
        EventManager.emit("game/chuizi_qiao", {
          idx: data.idx,
          seat: data.seat
        });
        PromiseUtil.wait(1.2).then(e => {
          GameManager.flagSelecting = false;
          EventManager.emit("game/toggleGameMask", { flag: false });
          EventManager.emit("game/crash", data);
        });
        break;
      }
      case "SHUFFLE": {
        this.setGameData(data.gameInfo);
        EventManager.emit("game/toggleGameMask", { flag: true });
        AudioPlayer.playEffectByUrl("sound/下方随机打乱音效");
        EventManager.emit("game/shuffle", data);
        PromiseUtil.wait(1.4).then(e => {
          EventManager.emit("game/toggleGameMask", { flag: false });
        });
        break;
      }
      case "ERROR": {
        let msg = data.data && data.data.msg;
        if (data.protocle == "connect") {
          SocketManager.disconnect();
          let r = confirm(msg);
          if (r) {
            location.reload();
          }
        } else {
          setTimeout(() => {
            console.log("展示toast", data.data);
            Utils.showToast(msg);
          }, 1000);
        }
        break;
      }
      case "GAME_FINISH": {
        SocketManager.orderMap = data.orderMap;
        AudioPlayer.stopAllEffect();
        AudioPlayer.stopAllMusic();
        AudioPlayer.playMusicByUrl("sound/大厅bgm-完美循环");
        this.setGameData(data.gameInfo);
        EventManager.emit("game/finish", data);
        break;
      }
      case "RANK_UPDATE": {
        SocketManager.lastRankInfo = data.rankInfo;
        EventManager.emit("game/updateRank");
        break;
      }
      // 更新游戏数据
      case "UPDATE_GAME_INFO": {
        this.setGameData(data.gameInfo);
        break;
      }
      case "SHOW_GAME_START": {
        EventManager.emit("game/showAniStart");
        break;
      }
      case "RANK_GAME_START": {
        this.setGameData(data.gameInfo);
        PopupManager.show("modal/ModalGame", { isReconnect: true });
        break;
      }
    }
  }
  static setGameData(gameInfo) {
    GameManager.listData = gameInfo.listData;
    SocketManager.matchInfo = Object.assign({}, gameInfo);
    SocketManager.matchInfo.round = Math.ceil(gameInfo.round / 2);
    SocketManager.matchInfo.turn =
      gameInfo.turn + (gameInfo.round % 2 == 1 ? 0 : 2);
    console.log(
      gameInfo.round,
      gameInfo.turn,
      SocketManager.matchInfo.round,
      SocketManager.matchInfo.turn
    );
    SocketManager.selfColor = gameInfo.seatMap[SocketManager.userInfo.uid];
  }
  static async onConnect() {
    this.sendMessage("RECONNECT", {
      isMatch: SocketManager.isMatch,
      type: SocketManager.type,
      lp: SocketManager.lp
    });
  }

  static sendMessage(type, data: any = {}) {
    this.socket.emit("message", {
      type,
      data,
      uid: this.userId,
      userInfo: SocketManager.userInfo
    });
  }

  static colorSTC(serverColor) {
    return this.selfColor == 1 ? serverColor : 3 - serverColor;
  }
  static userId = 1;
  static userInfo = {
    avatar: "",
    sex: 1,
    nickname: "测试玩家",
    uid: 1,
    score: 1000
  };

  static selfColor = 1;
  static get selfFirst() {
    return this.matchInfo.turnList[0] == this.selfColor;
  }
  static get powerSeat() {
    let serverColor = this.matchInfo.turnList[this.matchInfo.turn - 1];
    return this.colorSTC(serverColor);
  }
  static get currentData() {
    let serverColor = this.matchInfo.turnList[this.matchInfo.turn - 1];
    return serverColor == 1 ? this.matchInfo.data1 : this.matchInfo.data2;
  }
  static get selfData() {
    return this.selfColor == 1 ? this.matchInfo.data1 : this.matchInfo.data2;
  }
  static get oppoData() {
    return this.selfColor == 2 ? this.matchInfo.data1 : this.matchInfo.data2;
  }
  static matchInfo = {
    winner: 0,
    round: 1,
    turn: 0,
    turnList: [1, 1, 2, 2],
    data1: {
      propId: 1,
      gridType: 3,
      skillPrg: 0,
      score: 0,
      uid: 0,
      avatar: "",
      nickname: "",
      shuffle: 1,
      chuizi: 1
    },
    data2: {
      propId: 2,
      gridType: 4,
      skillPrg: 0,
      score: 0,
      uid: 0,
      avatar: "",
      nickname: "",
      shuffle: 1,
      chuizi: 1
    },
    timeNextStep: 0
  };

  static disconnect() {
    this.socket.disconnect();
  }
  // 1普通2比赛
  static init() {
    this.equipment = Utils.getQueryVariable("equipment") || 1;
    this.matchId = Utils.getQueryVariable("matchId");
    this.roomId = Utils.getQueryVariable("roomId");
    this.withRobot = !!Utils.getQueryVariable("withRobot");
    if (this.roomId == 0) {
      this.roomId = null;
    }
    this.isMatch = Utils.getQueryVariable("type") % 2 == 0 || false;
    this.type = +Utils.getQueryVariable("type");
    this.lp = +Utils.getQueryVariable("lp");

    GameManager.playMusicSpecialX = Utils.throttle(e => {
      console.log("特殊消除飘上去的音效");
      AudioPlayer.playEffectByUrl("sound/特殊消除飘上去的音效");
    }, 800);
    GameManager.playMusicX = Utils.throttle(e => {
      console.log("普通消除后飘上去特效音效");
      AudioPlayer.playEffectByUrl("sound/普通消除后飘上去特效音效");
    }, 800);

    if (this.socket) {
      return;
    }
    console.log("connect");
    // let url = "ws://localhost:9001";
    // let url = "ws://39.101.162.107:9001";
    let url = "ws://47.104.75.139:9001";
    if (Utils.getQueryVariable("local") == 1) {
      url = "ws://localhost:9001";
    }
    this.socket = this.io(url);
    this.listen();
  }
  // 进入匹配界面
  static goSceneMatch() {
    PopupManager.show("modal/ModalMatch");
  } // 进入匹配界面
  static goShowResult() {
    PopupManager.show("modal/ModalResult");
  }
}

window["SocketManager"] = SocketManager;

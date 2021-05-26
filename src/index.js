import Wrapper from './wrapper';
import { getBoundingClientRect, isClickTrackArea, getActivePage } from './helper';
import generateReport from './report';

class Tracker extends Wrapper {
  constructor({
    tracks,
    onTrackEvent = () => { },
    isUsingPlugin,
    watchRouteChange,
    asyncReg = false
  }) {
    super(isUsingPlugin);
    // 埋点配置信息
    this.tracks = asyncReg ? [] : tracks;
    // 埋点通知回调事件
    this.onTrackEvent = onTrackEvent;
    // 自动给每个page增加elementTracker方法，用作元素埋点
    this.addPageMethodExtra(this.elementTracker());
    // 自动给page下预先定义的方法进行监听，用作方法执行埋点
    this.addPageMethodWrapper(this.methodTracker());
    // 自动给page component下预先定义的方法进行监听，用作方法执行埋点
    this.addComponentMethodWrapper(this.comMethodTracker());

    if (watchRouteChange) {
      this.regRouteChangeWatcher()
    }
  }

  /**
   * @description: 接受异步注入的配置
   * @param {*} tracks
   * @return {*}
   */
  regConfig(tracks) {
    this.tracks = tracks;
  }

  regRouteChangeWatcher() {
    wx.onAppRoute(routeRes => {
      const report = []
      Object.keys(routeRes).forEach(key => {
        report.push({
          name: key,
          data: routeRes[key]
        })
      })
      const reportData = {
        evtName: 'route_change',
        report,
      }
      this.onTrackEvent(reportData)
    })
  }

  /**
   * @description: 接收元素的事件，会被注入到对应函数的下方
   * @param {*}
   * @return {*}
   */
  elementTracker() {
    // elementTracker变量名尽量不要修改，因为他和wxml下的名字是相对应的
    const elementTracker = (e) => {
      const tracks = this.findActivePageTracks('element');
      const { data } = getActivePage();
      tracks.forEach((track) => {
        getBoundingClientRect(track.element).then((res) => {
          res.boundingClientRect.forEach((item) => {
            const isHit = isClickTrackArea(e, item, res.scrollOffset);
            track.dataset = item.dataset;
            // isHit && report(track, data);
            isHit && this.handleReport(track, data)
          });
        });
      });
    };
    // 在ios真机实测的时候，发现es6的箭头函数会变成匿名函数，通过name属性无法获取到函数名，故在这做兼容
    elementTracker.customName = 'elementTracker'
    return elementTracker;
  }

  /**
   * @description: 方法捕获事件，会被检测后进行包装
   * @param {*}
   * @return {*}
   */
  methodTracker() {
    return (page, component, methodName, args = {}) => {
      const tracks = this.findActivePageTracks('method');
      const { data } = getActivePage();
      const { dataset } = args.currentTarget || {};
      tracks.forEach((track) => {
        if (track.method === methodName) {
          track.dataset = dataset;
          track.args = args || [];
          // report(track, data);
          this.handleReport(track, data)
        }
      });
    };
  }

  /**
   * @description: 组件方法包装
   * @param {*}
   * @return {*}
   */
  comMethodTracker() {
    // function函数改变上下文this指针，指向组件
    const self = this
    return function (page, component, methodName, args = {}) {
      const tracks = self.findActivePageTracks('comMethod');
      const data = this.data;
      const { dataset } = args.currentTarget || {};
      tracks.forEach((track) => {
        if (track.method === methodName) {
          track.dataset = dataset;
          // report(track, data);
          self.handleReport(track, data)
        }
      });
    };
  }

  /**
   * 获取当前页面的埋点配置
   * @param {String} type 返回的埋点配置，options: method/element/comMethod
   * @returns {Object}
   */
  findActivePageTracks(type) {
    try {
      const { route } = getActivePage();
      const pageTrackConfig = this.tracks.find(item => item.path === route) || {};
      let tracks = [];
      if (type === 'method') {
        tracks = pageTrackConfig.methodTracks || [];
      } else if (type === 'element') {
        tracks = pageTrackConfig.elementTracks || [];
      } else if (type === 'comMethod') {
        tracks = pageTrackConfig.comMethodTracks || [];
      }
      return [...tracks];
    } catch (e) {
      return {};
    }
  }

  /**
   * @description: 将埋点数据回传到app.js
   * @param {*} track
   * @param {*} data
   * @return {*}
   */
  handleReport(track, data) {
    const reportData = {
      evtName: track.evtName || '',
      report: generateReport(track, data),
    }
    this.onTrackEvent(reportData, track)
  }

  emit(evtName, emitData) {
    if (!Array.isArray(emitData)) {
      emitData = [emitData]
    }
    const reportData = {
      evtName: evtName || '',
      report: emitData,
    }
    console.table(emitData)
    this.onTrackEvent(reportData)
  }
}

export default Tracker;

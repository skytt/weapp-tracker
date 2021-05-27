# weapp-tracker

一款小程序自动埋点框架。
自 [xbosstrack](https://github.com/zhengguorong/xbosstrack-wechat) 修改而来并做了完善，感谢原作者。

## 特性

- 支持在页面元素/方法/自定义组件上加入埋点
- 支持从网络异步获取埋点配置
- 支持页面路由事件监听
- 支持手动提交埋点事件

## 使用方法

1. app.js 文件引入资源

```javascript
// 引入埋点SDK
import Tracker from "./weapptracker.min.js";
```

2. 配置埋点
   埋点以页面作为核心，每个页面分别支持通过元素、方法、自定义组件的维度添加埋点。
   详细的配置信息可参考[埋点配置章节](#埋点配置)内容。

```javascript
const trackConfig = [
  {
    path: "pages/home/home", // 页面路径
    elementTracks: [
      // 元素埋点
    ],
    methodTracks: [
      // 方法埋点
    ],
    comMethodTracks: [
      // 自定义组件埋点
    ],
  },
  // 数组中可以添加多个页面埋点配置对象
];
```

3. 初始化
   SDK 的初始化通过在 App 下进行挂载，可在任意组件中通过`getApp().track`进行访问。
   在初始化过程中需要的参数如下：

|      参数名      |   类型   | 说明                                                                 | 是否必须 | 示例                                  |
| :--------------: | :------: | -------------------------------------------------------------------- | :------: | ------------------------------------- |
|   onTrackEvent   | Function | 埋点被触发后的回调函数，处理方式可参考[埋点事件回调](#埋点事件回调) |  `true`  | `(report) => { console.log(report) }` |
|      tracks      |  Array   | 预置埋点时候的组件                                                   | `false`  |                                       |
|     asyncReg     | Boolean  | 是否异步加载埋点配置。在需要通过网络获取埋点配置时开启               | `false`  |                                       |
| watchRouteChange | Boolean  | 是否开启路由监听                                                     | `false`  |                                       |

SDK 支持在开发程序的时候预置埋点，也可以在运行时通过网络获取埋点配置信息，便于实时对埋点进行调整。

- 预置埋点

```javascript
App({
  /**
   * 生命周期函数及其他配置项
   */
  track: new Tracker({
    tracks: trackConfig, // 使用上方第2步生成的埋点配置
    watchRouteChange: true, // 开启路由监听
    onTrackEvent: (reportData, track) => {
      // 监听回调处理函数
    },
  }),
});
```

- 异步从网络拉取埋点配置

```javascript
App({
  /**
   * 生命周期函数及其他配置项
   */
  onLaunch() {
    const _this = this;
    wx.request({
      url: "config url",
      success: function (res) {
        _this.track.regConfig(res.data);
      },
    });
  },
  track: new Tracker({
    asyncReg: true, // 开启异步监听配置
    watchRouteChange: true, // 开启路由监听
    onTrackEvent: (reportData, track) => {
      // 监听回调处理函数
    },
  }),
});
```

4. 在注册了元素监听页面的 wxml 最外层插入「elementTracker」方法

```html
<view catchtap="elementTracker">
  <view></view>
</view>
```

## 埋点配置

下方展示了不同的埋点配置方式。除了自动埋点以外，还可以通过手动埋点的方式在 utils 工具类中实现数据上报。

自动上报时，支持通过特殊的 dataKeys 值来获取点击事件的 event 或方法执行的函数，详见[DataKeys 中的特殊键值](#`DataKeys`中的特殊键值)章节。

### 页面元素埋点

页面元素的埋点通过配置项中的`elementTracks`数组指定，可在元素被点击时触发，数组内的对象配置如下表。

|   参数   |  类型  | 说明                                  | 是否必须 | 示例                   |
| :------: | :----: | ------------------------------------- | :------: | ---------------------- |
| evtName  | String | 事件名称                              |  `true`  | `'app'`                |
| element  | String | 元素标识，可通过 id 或 class 进行查找 |  `true`  | `'.container'`         |
| dataKeys | Array  | 需要获取的参数                        | `false`  | `['$DATASET.payload']` |

若需要监听页面自定义组件内的元素，可通过`element: '.page >>> .sub-component'`方法指定。

其中，`.page`表示包裹组件的元素 class，或者你可以使用 id 或者任意选择器；`.sub-component`表示监听组件内元素 class 名。

实现的核心利用了微信的选择器，可以[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.selectAll.html)。

### 页面方法埋点

方法埋点通过配置项中的`methodTracks`数组指定，在方法被执行时候触发，数组内的对象配置如下表。

|   参数   |  类型  | 说明                   | 是否必须 | 示例              |
| :------: | :----: | ---------------------- | :------: | ----------------- |
| evtName  | String | 事件名称               |  `true`  | `'app'`           |
|  method  | String | 需要监听的页面方法名称 |  `true`  | `'onAppOpen'`     |
| dataKeys | Array  | 需要获取的参数         | `false`  | `['$ARG.params']` |

### 组件方法埋点

组件的方法埋点需要用`comMethodTracks`数组单独指定，在组件方法被执行时候触发。其中获取的 dataKeys 作用域为组件内部作用域，与调用组件的页面没有关联。

|   参数   |  类型  | 说明                   | 是否必须 | 示例              |
| :------: | :----: | ---------------------- | :------: | ----------------- |
| evtName  | String | 事件名称               |  `true`  | `'app'`           |
|  method  | String | 需要监听的页面方法名称 |  `true`  | `'onAppOpen'`     |
| dataKeys | Array  | 需要获取的参数         | `false`  | `['$ARG.params']` |

### 路由埋点

SDK 支持监听微信小程序的路由动态并进行事件反馈，通过初始化`Tracker`的时候的`watchRouteChange`配置项来控制是否开启。
开启路由监听后，当页面发生改变时，会触发`evtName`为`route-change`的事件回调，`report`字段内容同`wx.onAppRoute`事件回调一致。

### 手动提交埋点

除了自动监听事件外，SDK 还支持手动提交埋点的配置信息，通过`getApp().track.emit(evtName, report)`函数触发。

## 埋点事件回调

在初始化 SDK 过程中，可以将回调函数传递给`onTrackEvent`来接收埋点事件的回调。

`onTrackEvent`的第一个参数在任何时候都会返回一个对象，包含了`evtName`及`report`字段，分别是埋点事件指定的事件名称，和根据`dataKeys`配置生成的埋点数据数组。

当触发埋点的事件是配置项中的事件时（非手动提交埋点），`onTrackEvent`还会将 track 中的内容作为第二个参数返回。换而言之，可以通过在 track 配置项中增加自定义的字段以满足不同的业务场景需要，如增加`keyMap`字段用以将`dataKeys`中的值换成埋点上报时候的映射表。

下面的代码是一个回调的示例，实现了埋点数据的自动上报。

```javascript
onTrackEvent: (reportData, track = {}) => {
  const { evtName, report } = reportData;
  let data = {};
  const keyMap = track.keyMap || {};
  if (evtName) {
    report.forEach((item) => {
      data[keyMap[item.name] || item.name] = item.data;
    });
    TrackApi.reportData(evtName, data);
    console.log("埋点数据上报", evtName, data);
  }
};
```

## `DataKeys`中的特殊键值

自动埋点的过程中，可以指定以下特殊的 dataKeys 内容实现事件执行时数据的获取。

| 特殊值名称 | 含义                                                                                                                    | 使用实例       |
| :--------: | ----------------------------------------------------------------------------------------------------------------------- | -------------- |
|    $APP    | 读取 App 下定义的数据                                                                                                   | `$APP.track`   |
|  $DATASET  | 表示获取点击元素 data-xxx 中的 xxx 值                                                                                   | `$DATASET.id`  |
|   $INDEX   | 是$DATASET 的特殊语法糖，可以直接获取元素标签的 index 属性。使用时，请在对应的标签 wxml 中加入 data-index={{index}}标记 | `$INDEX`       |
|    $ARG    | 可以在方法监听中，获取方法被执行时的函数                                                                                | `$ARG.payload` |

## 【弃用】兼容插件模式

**【2021-05-27 更新】目前小程序已经支持定义插件后对 App、Page、Component 类的改写，以下方法已经弃用。**
由于 SDK 会改写 Page 对象，如果使用了插件，微信会禁止改写，可以通过以下方式改造。

```javascript
// 初始化插件模式
const tracker = new Tracker({ tracks: trackConfig, isUsingPlugin: true });
// 将原来的App包装
tracker.createApp({});
// 将原Page包装
tracker.createPage({});
// 将原Component包装
tracker.createComponent({});
```

## License

[996 License](https://github.com/zhengguorong/xbosstrack-wechat/blob/master/LICENSE)

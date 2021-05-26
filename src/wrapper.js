const globalVarApp = App; // 小程序原App对象
const globalVarPage = Page; // 小程序原Page对象
const globalVarComponent = Component; // 小程序原Component对象

class Wrapper {
  constructor(isUsingPlugin) {
    this.injectPageMethods = [];
    this.injectAppMethods = [];
    this.extraPageMethods = [];
    this.extraAppMethods = [];
    this.injectComponentMethods = [];
    this.extraComponentMethods = [];
    if (!isUsingPlugin) {
      App = (app) => globalVarApp(this._create(app, this.injectAppMethods, this.extraAppMethods));
      Page = (page) => globalVarPage(this._create(page, this.injectPageMethods, this.extraPageMethods));
      Component = (component) => globalVarComponent(this._createComponent(component, this.injectComponentMethods, this.extraComponentMethods));
    }
  }

  /**
   * 对用户定义函数进行包装.
   * @param {Object} target page对象或者app对象
   * @param {String} methodName 需要包装的函数名
   * @param {Array} methods 函数执行前执行任务
   */
  _wrapTargetMethod(target, component, methodName, methods = []) {
    const methodFunction = target[methodName];
    target[methodName] = function _wrapperCreatedFunc(...args) {
      const result = methodFunction && methodFunction.apply(this, args);
      const methodExcuter = () => {
        methods.forEach((fn) => {
          fn.apply(this, [target, component, methodName, ...args]);
        });
      };
      try {
        if (Object.prototype.toString.call(result) === '[object Promise]') {
          result.then(() => {
            methodExcuter();
          }).catch(() => {
            methodExcuter();
          });
        } else {
          methodExcuter();
        }
      } catch (e) {
        console.error(methodName, '钩子函数执行出现错误', e);
      }
      return result;
    };
  }

  /**
   * 追加函数到Page/App对象
   * @param {Object} target page对象或者app对象
   * @param {Array} methods 需要追加的函数数组
   */
  _addExtraMethod(target, methods) {
    methods.forEach(fn => {
      // 兼容强制定义的函数名
      const methodName = fn.customName || fn.name;
      target[methodName] = fn;
    });
  }

  /**
   * @param {*} target page对象或者app对象
   * @param {*} methods 需要插入执行的函数
   */
  _create(target, injectMethods, extraMethods) {
    Object.keys(target)
      .filter((prop) => typeof target[prop] === 'function')
      .forEach((methodName) => {
        this._wrapTargetMethod(target, null, methodName, injectMethods);
      });
    this._addExtraMethod(target, extraMethods);
    return target;
  }

  /**
   * @description: 包装component
   * @param {*} component
   * @param {*} injectMethods
   * @param {*} extraMethods
   * @return {*}
   */
  _createComponent(component, injectMethods, extraMethods) {
    const target = component.methods || {};   // 部分组件不带methods属性，做兼容
    Object.keys(target)
      .filter((prop) => typeof target[prop] === 'function')
      .forEach((methodName) => {
        this._wrapTargetMethod(target, component, methodName, injectMethods);
      });
    this._addExtraMethod(target, extraMethods);
    return component;
  }

  addPageMethodWrapper(fn) {
    this.injectPageMethods.push(fn);
  }

  addComponentMethodWrapper(fn) {
    this.injectComponentMethods.push(fn);
  }

  addAppMethodWrapper(fn) {
    this.injectAppMethods.push(fn);
  }

  addPageMethodExtra(fn) {
    this.extraPageMethods.push(fn);
  }

  addAppMethodExtra(fn) {
    this.extraAppMethods.push(fn);
  }

  /**
   * 以下三个方法用以在使用插件的时候对app/page/component进行包装
   * 在小程序支持库2.6.3后，已经开放了使用插件时候对基础类的修改限制，故已经废弃使用
   * 为了保证向下兼容的可能性，做保留
   */
  createApp(app) {
    globalVarApp(this._create(app, this.injectAppMethods, this.extraAppMethods));
  }

  createPage(page) {
    globalVarPage(this._create(page, this.injectPageMethods, this.extraPageMethods));
  }

  createComponent(component) {
    globalVarPage(this._createComponent(component, this.injectPageMethods, this.extraPageMethods));
  }
}

export default Wrapper;

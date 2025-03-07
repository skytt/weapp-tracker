/**
 * 解析数组类型dataKey
 * 例如list[$INDEX],返回{key:list, index: $INDEX}
 * 例如list[4],返回{key:list, index: 4}
 * @param {*} key
 * @param {*} index
 */
const resolveArrayDataKey = (key, index) => {
  const leftBracketIndex = key.indexOf('[');
  const rightBracketIndex = key.indexOf(']');
  const result = {};
  if (leftBracketIndex > -1) {
    let arrIndex = key.substring(leftBracketIndex + 1, rightBracketIndex);
    const arrKey = key.substring(0, leftBracketIndex);
    if (arrIndex === '$INDEX') {
      arrIndex = index;
    }
    result.key = arrKey;
    result.index = parseInt(arrIndex, 10);
  }
  return result;
};

/**
 * 获取全局数据
 * @param {*} key 目前支持$APP.* $DATASET.* $INDEX $ARG.*
 * @param {*} dataset 点击元素dataset
 * @param {*} index 点击元素索引
 */
const getGlobalData = (key, dataset = {}, args = {}) => {
  let result = '';
  if (key.indexOf('$APP.') > -1) {
    const App = getApp();
    const appKey = key.split('$APP.')[1];
    result = App[appKey];
  } else if (key.indexOf('$DATASET.') > -1) {
    const setKey = key.split('$DATASET.')[1];
    result = dataset[setKey];
  } else if (key.indexOf('$INDEX') > -1) {
    result = dataset.index;
  } else if (key.indexOf('$ARG') > -1) {
    const argKey = key.split('$ARG.')[1];
    result = args[argKey];
  }
  return result;
};

/**
 * @description: 从页面中获取data的内容
 * @param {*} key
 * @param {*} dataset
 * @param {*} pageData
 * @return {*}
 */
const getPageData = (key, dataset = {}, pageData) => {
  const { index } = dataset;
  const keys = key.split('.');
  let result = pageData;
  if (keys.length > -1) {
    keys.forEach((name) => {
      const res = resolveArrayDataKey(name, index);
      if (res.key && result[res.key]) {
        result = result[res.key][res.index];
      } else {
        result = result[name];
      }
    });
  } else {
    result = pageData[key];
  }
  return result;
};

/**
 * @description: 根据key的内容蓉dataset/pageData内寻找对应的值
 * @param {*} key
 * @param {*} dataset
 * @param {*} pageData
 * @return {*}
 */
const dataReader = (key, dataset, pageData, args) => {
  try {
    let result = '';
    if (key.indexOf('$') === 0) {
      result = getGlobalData(key, dataset, args);
    } else {
      result = getPageData(key, dataset, pageData);
    }
    return result;
  } catch (e) {
    console.log(e);
    return '';
  }
};

/**
 * @description: 生成返回数据数组
 * @param {*} track
 * @param {*} pageData
 * @return {Array} 指定的返回数据
 */
const generateReport = (track, pageData) => {
  const { element, method } = track;
  const logger = [];
  track.dataKeys.forEach(name => {
    const data = dataReader(name, track.dataset, pageData, track.args);
    logger.push({ element, method, name, data });
  });
  console.log(track.args)
  console.table(logger);
  return logger
};

export default generateReport;

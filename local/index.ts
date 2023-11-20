/**
 * 是否存在cordova
 */
export const cordovaExist = () => {
  if (typeof window.cordova === 'undefined') {
    return false;
  }
  return true;
};

/**
 * 自定义插件根路径
 */
export const getPlugin = () => {
  return window.cordova.plugins.CustomPlugin;
};

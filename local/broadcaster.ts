import { onBeforeUnmount } from 'vue';

export default function () {
  let listenerFun = null;

  // 传递function有作用域的问题，使用普通函数
  const startBroadcaster = function (listener: Function) {
    if (window.cordova) {
      if (window.cordova.platformId === 'android') {
        // window.broadcaster.addEventListener('didShow', listener);

        // window.broadcaster.addEventListener(
        //   'android.net.conn.CONNECTIVITY_CHANGE',
        //   true,
        //   listener
        // );

        listenerFun = listener;

        window.broadcaster.addEventListener('com.maoyan', true, listenerFun);
      } else {
        console.log('不是android手机');
        console.log(window.cordova);
      }
    }
  };

  const stopBroadcaster = () => {
    if (window.broadcaster) {
      console.log('关闭广播监听');
      window.broadcaster.removeEventListener('com.maoyan', listenerFun);
    }
  };

  onBeforeUnmount(() => {
    stopBroadcaster();
  });

  return { startBroadcaster, stopBroadcaster };
}

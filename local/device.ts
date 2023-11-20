import { getPlugin } from './index';

// 获取手机序列号
export const getDeviceSN = () => {
  return new Promise<string>((resolve) => {
    let plugin = getPlugin();
    const resloveError = () => {
      resolve('');
    };
    const success = (data) => {
      try {
        if (data.sn) {
          resolve(data.sn);
          return;
        } else {
          resloveError();
          return;
        }
      } catch (e) {
        console.log('设备sn返回成功，处理失败', e);
      }
      console.log('获取设备sn失败', data);
      resloveError();
    };

    const error = (err) => {
      console.log(err, '获取sn失败');
      resloveError();
    };

    plugin.device.getSN('', success, error);
  });
};

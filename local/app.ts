import { getFile, isDev } from '@/utils/tool';
import { cordovaExist } from './index';
import { ref } from 'vue';

// 获取版本号
export const appVersion = () => {
  if (!cordovaExist()) {
    console.log('cordova不存在');
    return '';
  }
  return new Promise<string>((resolve, reject) => {
    window.cordova.getAppVersion
      .getVersionNumber()
      .then(function (version) {
        resolve(version);
      })
      .catch(function (error) {
        console.error('获取版本号失败:', error);
        reject(false);
      });
  });
};

// apk下载
export const downloadApk = () => {
  const progress = ref(0);
  const startWork = async (url: string) => {
    progress.value = 0;
    if (isDev()) {
      const res: any = await getFile(url);
    } else {
      console.log('执行app更新操作');
      let fileURL = `${window.cordova.file.externalDataDirectory}/maoyan2.apk`;
      const fileTransfer = new window.FileTransfer();
      // 下载进度
      fileTransfer.onprogress = function (progressEvent) {
        if (progressEvent.lengthComputable) {
          const percentage = Math.floor(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          // 进度更新
          progress.value = percentage;
        } else {
          console.log('无法计算进度信息');
        }
      };
      console.log('开始下载apk');
      fileTransfer.download(
        url,
        fileURL,
        (entry) => {
          console.log('下载完成: ' + entry.toURL());
          window.cordova.plugins.fileOpener2.open(
            fileURL,
            'application/vnd.android.package-archive',
            {
              error: (e) => console.error('文件打开失败:', e),
              success: (e) => console.log('文件打开成功', e),
            }
          );
        },
        (error) => {
          console.error('新版本下载失败:', error);
        },
        true // 设置为 true 表示覆盖已存在的文件
      );
    }
  };

  return { progress, startWork };
};

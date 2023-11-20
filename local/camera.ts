// 启用摄像头
export const startCameraPreview = async () => {
  // 显示成功回调
  const showSuccess = (msg: any) => {
    console.log(msg);
  };

  // 显示失败回调
  const showError = (error) => {
    console.log('显示摄像头内容失败', error);
  };
  const successCallback = (event: any) => {
    console.log(event, '启动成功');
    // 将预览的画面显示在一个HTML元素中
    window.CameraPreview.show(showSuccess, showError);
  };

  const errorCallback = (error) => {
    console.log('摄像头打开失败', error);
  };

  const cameraOptions = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    camera: 'back',
    tapPhoto: false,
    previewDrag: false,
    toBack: true,
    alpha: 1,
  };

  try {
    window.CameraPreview.startCamera(
      cameraOptions,
      successCallback,
      errorCallback
    );
  } catch (error) {
    console.error('无法启动摄像头预览', error);
  }
};

// 摄像头翻转
export const switchCamera = () => {
  window.CameraPreview.switchCamera();
};

// 关闭摄像头
export const closeCamera = () => {
  try {
    window.CameraPreview.stopCamera();
  } catch (e) {
    console.log('摄像头关闭失败', e);
  }
};

export function checkPermission() {
  return new Promise(async (resolve) => {
    let permissions = window.cordova.plugins.permissions;
    //定义需要获取的手机权限List
    let list = [
      permissions.WRITE_EXTERNAL_STORAGE,
      permissions.READ_EXTERNAL_STORAGE,
      permissions.CAMERA,
      permissions.READ_PHONE_STATE,
      permissions.READ_PRIVILEGED_PHONE_STATE,
      // permissions.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
    ];

    //检查权限
    permissions.hasPermission(
      list,
      async function (s) {
        //检查成功
        console.log('权限检测成功,准备校验', s);
        let status = await checking(s, list, permissions);
        resolve(status);
      },
      function (error) {
        //检查失败
        console.log('权限检测失败', error);
        resolve(false);
      }
    );
  });
}

function checking(s, permList, permissions) {
  return new Promise((resolve) => {
    //hasPermission 验证app是否有权限
    if (!s.hasPermission) {
      //没有权限	调用申请
      permissions.requestPermissions(
        permList,
        function (succ) {
          if (succ.hasPermission) {
            //申请成功
            console.log('申请成功');
            resolve(true);
          } else {
            //申请失败
            console.log('申请失败');
            resolve(false);
          }
        },
        function (error) {
          console.log('申请失败:' + JSON.stringify(error));
          resolve(false);
        }
      );
    } else {
      //拥有权限
      console.log('拥有权限');
      resolve(true);
    }
  });
}

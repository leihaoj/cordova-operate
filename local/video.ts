import { createDirectory } from './file';
import { LOCAL_FILE_DOCUMENTS, LOCAL_FILE_PATH } from '@/constants';

/**
 * 获取手机视频列表
 */
export const getVideoList = () => {
  return new Promise<string[]>(async (reslove, reject) => {
    // let directoryReader = fileSystem.root.createReader();
    // directoryReader.readEntries(onSuccess, onFileSystemError);
    // cordova.file.externalRootDirectory --外部存储的根目录路径

    // 视频目录
    const directoryName = LOCAL_FILE_PATH;

    // 创建目录
    try {
      await createDirectory(
        window.cordova.file.externalRootDirectory + LOCAL_FILE_DOCUMENTS,
        directoryName
      );
    } catch (e) {
      console.log(e, '创建目录失败video.file');
    }

    // 要获取的文件目录列表
    const dirList = [
      `file:///storage/emulated/0/${LOCAL_FILE_DOCUMENTS}/${directoryName}`,
      'file:///storage/emulated/0/DCIM',
      'file:///storage/emulated/0/Pictures',
    ];

    let videoList = [];

    const onFileSystemError = (error) => {
      console.log('权限获取失败', error);
      reject([]);
    };

    // 权限获取成功
    const onFileSystemSuccess = (fileSystem) => {
      console.log('权限获取成功');
      getVideo();
    };

    // 获取视频
    const getVideo = async () => {
      for (let i = 0; i < dirList.length; i++) {
        let path = dirList[i];
        console.log('路径', path);
        try {
          const list = await getSpecifyDirectoryVideo(path);
          list.forEach((url: string) => {
            videoList.push(url);
          });
        } catch (e) {
          console.log(e, `路径:${path}-读取失败`);
        }
      }
      console.log('全部获取完毕', videoList);
      // 执行完毕
      reslove(videoList);
    };

    // 文件权限
    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      onFileSystemSuccess,
      onFileSystemError
    );
  });
};

// 获取指定目录下的视频
export const getSpecifyDirectoryVideo = (filepath: string) => {
  return new Promise<string[]>(async (reslove, reject) => {
    const traverse = async (directoryEntry) => {
      const totalList = [];
      // 递归获取视频
      const onTraverseDirectory = async (directoryEntry) => {
        const fileEntries = await getFilesInDirectory(directoryEntry);
        const videoFiles = filterVideoFiles(fileEntries);
        videoFiles.forEach((item: string) => {
          totalList.push(item);
        });

        for (const fileEntry of fileEntries) {
          if (fileEntry.isDirectory) {
            await onTraverseDirectory(fileEntry); // 递归遍历子目录
          }
        }

        return videoFiles;
      };
      await onTraverseDirectory(directoryEntry);
      // 操作完毕
      reslove(totalList);
    };

    // 目录获取成功
    function onDirectorySuccess(directoryEntry) {
      // 递归获取所有视频文件
      traverse(directoryEntry);
    }
    const onFileSystemError = (error) => {
      console.log('视频获取失败', error);
      reject([]);
    };
    // 文件路径获取成功
    const filePathSuccess = (fileEntry) => {
      window.resolveLocalFileSystemURL(
        fileEntry,
        onDirectorySuccess,
        onFileSystemError
      );
    };
    // 文件路径获取失败
    const filePathError = (error) => {
      console.log(error, '文件路径获取失败');
    };
    window.FilePath.resolveNativePath(filepath, filePathSuccess, filePathError);
  });
};

const getFilesInDirectory = (directoryEntry) => {
  return new Promise<any[]>((resolve, reject) => {
    const directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(
      (entries) => {
        resolve(entries);
      },
      (error) => {
        console.log('video.getFilesInDirectory报错了', error);
        resolve([]);
      }
    );
  });
};

const filterVideoFiles = (fileEntries) => {
  const videoFiles = [];

  for (const fileEntry of fileEntries) {
    const fileName = fileEntry.name;
    const fileExtension = fileName
      .substring(fileName.lastIndexOf('.') + 1)
      .toLowerCase();

    if (isVideoFile(fileExtension)) {
      videoFiles.push(fileEntry.toURL());
    }
  }

  return videoFiles;
};

const isVideoFile = (fileExtension) => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv']; // 视频文件扩展名列表

  return videoExtensions.includes(fileExtension);
};

// old
// return new Promise<string[]>((reslove, reject) => {
//     const onFileSystemError = (error) => {
//       console.log('视频获取失败', error);
//       reject([]);
//     };

//     const onFileParentSuccess = (directoryEntry) => {
//       let videoList = [];
//       // 总递归次数
//       let total = 0;
//       // 递归次数完成
//       let current = 0;
//       const onFileSuccess = (entries) => {
//         let childList = [];
//         // 递归获取成功时
//         for (let i = 0; i < entries.length; i++) {
//           let entry = entries[i];
//           if (entry.isDirectory) {
//             let directoryReader = entry.createReader();
//             entryReader.readEntries(onFileSuccess, onFileSystemError);
//             // 递归进入子目录
//             total += 1;
//           } else {
//             let fileExtension = entry.name.split('.').pop();
//             console.log('文件名', entry.name);
//             if (
//               fileExtension === 'mp4' ||
//               fileExtension === 'avi' ||
//               fileExtension === 'mov'
//             ) {
//               // 获取文件的完整路径
//               let url = entry.toURL();
//               console.log('正在push');
//               videoList.push(url);
//             }
//           }
//         }
//         current += 1;
//         if (total === current) {
//           console.log('执行完毕', videoList);
//           console.log('执行完毕', videoList.length);
//           reslove(videoList);
//         }
//       };
//     };

//     let directoryReader = directoryEntry.createReader();
//     directoryReader.readEntries(onFileParentSuccess, onFileSystemError);
//   });

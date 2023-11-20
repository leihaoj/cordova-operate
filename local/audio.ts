import { createDirectory, convertExternalRootDir, getFileEntry } from './file';
import { LOCAL_FILE_DOCUMENTS, LOCAL_FILE_PATH } from '@/constants';
import { getPlugin } from './index';

/**
 * 获取手机音频
 */
export const getAudioList = () => {
  return new Promise<string[]>(async (reslove, reject) => {
    try {
      // 目录
      const directoryName = LOCAL_FILE_PATH;
      console.log('获取音频1');
      // 创建目录
      try {
        await createDirectory(
          window.cordova.file.externalRootDirectory + LOCAL_FILE_DOCUMENTS,
          directoryName
        );
      } catch (e) {
        console.log(e, '创建目录失败audio.file');
      }

      console.log('获取音频2');

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

      // 获取音频
      const getVideo = async () => {
        for (let i = 0; i < dirList.length; i++) {
          let path = dirList[i];
          console.log('路径', path);
          try {
            const list = await getSpecifyDirectoryAudio(path);
            list.forEach((item: any) => {
              videoList.push(item);
            });
          } catch (e) {
            console.log(e, `路径:${path}-读取失败`);
            continue;
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
    } catch (e) {
      console.log('获取音频列表失败', e);
    }
  });
};

// 获取指定目录下的音频
export const getSpecifyDirectoryAudio = (filepath: string) => {
  return new Promise<string[]>(async (reslove, reject) => {
    const traverse = async (directoryEntry) => {
      const totalList = [];
      // 递归获取
      const onTraverseDirectory = async (directoryEntry) => {
        const fileEntries = await getFilesInDirectory(directoryEntry);
        const videoFiles = filterAudioFiles(fileEntries);
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
        console.log('audio.getFilesInDirectory报错了', error);
        resolve([]);
      }
    );
  });
};

const filterAudioFiles = (fileEntries) => {
  const audioFiles = [];

  for (const fileEntry of fileEntries) {
    const fileName = fileEntry.name;
    const fileExtension = fileName
      .substring(fileName.lastIndexOf('.') + 1)
      .toLowerCase();

    if (isAudioFile(fileExtension)) {
      audioFiles.push({
        oldUrl: fileEntry.nativeURL,
        url: fileEntry.toURL(),
        name: fileEntry.name,
      });
    }
  }

  return audioFiles;
};

const isAudioFile = (fileExtension) => {
  const audioExtensions = ['mp3', 'wav', 'aac'];

  return audioExtensions.includes(fileExtension);
};

/**
 * 自定义插件-获取音频列表
 */
export const getAudioListPlugin = () => {
  return new Promise<any[]>((resolve) => {
    const promiseError = () => {
      resolve([]);
    };
    try {
      let plugin = getPlugin();
      const success = async (data: any) => {
        let list = [];
        console.log(data, '音频文件');
        if (data && data.length) {
          for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let filePath = convertExternalRootDir(item.filePath);
            let entry: any = await getFileEntry(filePath);
            if (entry) {
              list.push({
                oldUrl: entry.nativeURL,
                url: entry.toURL(),
                name: entry.name,
              });
            }
          }
        }
        resolve(list);
      };

      const error = (err: any) => {
        console.log(err, '音频文件列表获取失败');
        promiseError();
      };

      plugin.audio.chooser('', success, error);
    } catch (e) {
      console.log('获取音频列表失败', e);
      promiseError();
    }
  });
};

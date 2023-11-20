import { isDev, getChineseTime } from '../tool';

// android文件根目录
export const rootDirectory = () => {
  if (window.cordova) {
    return window.cordova.file.externalRootDirectory;
  }
  return '';
};

// app外部存储位置
export const extDataDir = () => {
  if (window.cordova) {
    return window.cordova.file.externalDataDirectory;
  }
  return '';
};

// 获取文件或目录对象
export const getFileEntry = (path: string) => {
  if (isDev()) {
    return false;
  }
  return new Promise((resolve, reject) => {
    const onDirectorySuccess = (directoryEntry) => {
      resolve(directoryEntry);
    };

    const onFileSystemError = (error) => {
      writeLog.log(`路径:${path}，的文件对象获取失败`, error);
      resolve(false);
    };
    window.resolveLocalFileSystemURL(
      path,
      onDirectorySuccess,
      onFileSystemError
    );
  });
};

// 创建目录
export const createDirectory = (path: string, name: string) => {
  return new Promise<boolean>(async (resolve, reject) => {
    const onErrorGetDir = (error) => {
      try {
        if (error.code == 1) {
          // 目录已经存在
          resolve(true);
        } else {
          writeLog.log('目录创建失败', error);
          resolve(false);
        }
      } catch (e) {
        writeLog.log('创建目录失败后，操作再次失败', e);
        resolve(false);
      }
    };
    // 先获取目录对象
    let rootDirEntry: any = await getFileEntry(path);
    if (rootDirEntry) {
      rootDirEntry.getDirectory(
        name,
        { create: true, exclusive: false },
        function (dirEntry) {
          resolve(true);
        },
        onErrorGetDir
      );
    } else {
      // 没有父目录，无法创建
      resolve(false);
    }
  });
};

// 创建文件
export const onCreateFile = (
  path: string,
  name: string,
  isAppend: boolean = false
) => {
  return new Promise<boolean>(async (resolve, reject) => {
    // 先获取目录对象
    let rootDirEntry: any = await getFileEntry(path);
    if (rootDirEntry) {
      rootDirEntry.getFile(
        name,
        { create: true, exclusive: false },
        function (fileEntry) {
          resolve(true);
        },
        (err) => {
          writeLog.log('创建文件失败', err);
          resolve(false);
        }
      );
    } else {
      writeLog.log('没有父目录，无法创建');
      // 没有父目录，无法创建
      resolve(false);
    }
  });
};

// 删除文件
export const deleteFile = async (filepath: string) => {
  return new Promise<boolean>((resolve, reject) => {
    const success = () => {
      writeLog.log(`${filepath}-已成功删除`);
      resolve(true);
    };
    const error = (err) => {
      writeLog.error('删除时出现错误:', err);
      resolve(false);
    };
    window.resolveLocalFileSystemURL(
      filepath,
      function (fileEntry: any) {
        if (fileEntry.isFile) {
          fileEntry.remove(success, error);
        } else {
          // 目录
          fileEntry.removeRecursively(success, error);
        }
      },
      function (err) {
        writeLog.log('找不到文件', err);
        resolve(true);
      }
    );
  });
};

// 下载文件到指定目录
export const downloadFile = (url: string, path: string) => {
  // 测试环境没有这个功能
  if (isDev()) {
    return false;
  }
  return new Promise<boolean>((resolve, reject) => {
    const fileTransfer = new window.FileTransfer();
    fileTransfer.download(
      url,
      path,
      (entry) => {
        writeLog.log('下载成功: ' + entry.toURL());
        resolve(true);
      },
      (error) => {
        writeLog.error('下载失败:', error);
        resolve(false);
      },
      true // 设置为 true 表示覆盖已存在的文件
    );
  });
};

/**
 * 获取指定目录下的子目录列表
 * @param directoryEntry
 * @param filterName
 * @returns
 */
export const getFilesInDirectory = (
  directoryEntry: any,
  filterName: boolean = false
) => {
  return new Promise<any[]>((resolve, reject) => {
    const directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(
      (entries) => {
        if (filterName) {
          resolve(entries.map((item: any) => item.name));
        } else {
          resolve(entries);
        }
      },
      (error) => {
        writeLog.log('获取子目录列表失败', error);
        resolve([]);
      }
    );
  });
};

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

// 写入队列
const writeQueue = [];
// 是否正在写入
let isWriting = false;

// 开始写入
const startWrite = async (methodName: string, ...args) => {
  let path = extDataDir();
  // 创建一个log目录
  let status = await createDirectory(path, 'log');
  if (status) {
    // 按天创建日志
    let fileName = `${getChineseTime('day')}.txt`;
    let fileEntry: any = await getFileEntry(`${path}log/${fileName}`);
    if (!fileEntry) {
      // 不存在，创建文件
      await onCreateFile(`${path}log`, fileName);
    }
    // 追加内容
    fileEntry = await getFileEntry(`${path}log/${fileName}`);
    if (fileEntry) {
      let argsData = args.map((item: any) => {
        return `${JSON.stringify(item)} `;
      });
      let message = `[${getChineseTime('second')}]${methodName}:${argsData}\n`;
      // 转blob
      let blobMessage = new Blob([message], { type: 'text/plain' });
      const fileEntryWriter = (itemMessage: string = '') => {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            // 成功写入后，查看队列是否还有内容需要写入
            if (writeQueue.length > 0) {
              // 继续写入队列中的下一个内容
              fileEntryWriter(writeQueue.shift());
            } else {
              // 没有待写入的内容，设置标志位为false
              isWriting = false;
            }
          };

          fileWriter.onerror = function (e) {
            // 处理写入时发生的错误
            console.log('Failed file write: ' + e.toString());
            isWriting = false;
          };

          // 光标移动到最后
          fileWriter.seek(fileWriter.length);
          // 如果是第一次写入，则直接写
          if (!isWriting) {
            isWriting = true;
            fileWriter.write(blobMessage);
          } else {
            if (itemMessage) {
              fileWriter.write(itemMessage);
            } else {
              // 如果已经在写入中，则将数据放入队列
              writeQueue.push(blobMessage);
            }
          }
        });
      };
      // start
      fileEntryWriter();
    } else {
      originalConsole.log('文件不存在，无法追加内容');
    }
  } else {
    originalConsole.warn('日志目录创建失败');
  }
};

// 写入日志
export const writeLog = {
  log: (...args) => {
    console.log.apply(console, args);
    startWrite('log', ...args);
  },
  warn: (...args) => {
    console.warn.apply(console, args);
    startWrite('warn', ...args);
  },
  error: (...args) => {
    console.error.apply(console, args);
    startWrite('error', ...args);
  },
};

// 将文件复制到另一个位置
export const copyFileToAnotherLocation = (from: string | any) => {
  return new Promise(async (resolve) => {
    let to = `${extDataDir()}live`;
    let entry = from;
    if (typeof from === 'string') {
      entry = await getFileEntry(from);
    }
    // from文件读取失败
    if (!entry) {
      resolve(false);
    }
    let toEntry = await getFileEntry(to);
    if (!toEntry) {
      let created = await createDirectory(extDataDir(), 'live');
      if (!created) {
        resolve(false);
      } else {
        // 获取文件对象
        toEntry = await getFileEntry(to);
        if (!toEntry) {
          resolve(false);
        }
      }
    }

    const success = (fileEntry) => {
      writeLog.log('文件复制成功');
      resolve(fileEntry);
    };

    const error = (err) => {
      writeLog.log('文件复制失败', err);
      resolve(false);
    };

    // 复制
    entry.copyTo(toEntry, entry.name, success, error);
  });
};

/**
 * 将文件路径转换为file插件支持的格式
 * @param path
 * @returns
 */
export const convertExternalRootDir = (path: string) => {
  return path.replace('/storage/emulated/0/', rootDirectory());
};

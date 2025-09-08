export type StoredFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // text content kept in memory
};

const filesStore: Record<string, StoredFile> = {};

export const getFileStore = () => {
  return {
    addFile: (file: StoredFile) => {
      filesStore[file.id] = file;
      console.log("added file", JSON.stringify(filesStore, null, 2));
    },
    removeFile: (id: string) => {
      delete filesStore[id];
    },
    getFile: (id: string) => filesStore[id],
    listFiles: () => Object.values(filesStore),
  };
};

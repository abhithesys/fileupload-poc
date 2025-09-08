import { useState } from "react";

export type UploadedFile = {
  name: string;
  fileId: string;
};

type FileUploadResponse = {
  files: UploadedFile[];
};

export const useComposerState = () => {
  const [textContent, setTextContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse | null>(
    null
  );

  return { textContent, setTextContent, uploadedFiles, setUploadedFiles };
};

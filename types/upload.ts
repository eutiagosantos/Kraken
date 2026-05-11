export type UploadStatus = "processing" | "completed" | "error";

export interface Upload {
  id: string;
  status: UploadStatus;
}

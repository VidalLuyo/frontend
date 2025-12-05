const FILE_API_URL = "http://localhost:9087/api/files";

interface FileUploadResponse {
  url: string;
  originalName: string;
  message: string;
}

class FileService {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    console.log("[FileService] Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "justifications");

    console.log("[FileService] FormData prepared, sending request...");

    const response = await fetch(`${FILE_API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    console.log("[FileService] Upload response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("[FileService] Upload error:", error);
      throw new Error(error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[FileService] Upload success:", data);
    return data;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const response = await fetch(
      `${FILE_API_URL}/delete?url=${encodeURIComponent(fileUrl)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
  }
}

export const fileService = new FileService();
export default fileService;

import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [newName, setNewName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const fetchFiles = () => {
    api.get("/files").then((response) => setFiles(response.data.files || []));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const upload = async (event) => {
    event.preventDefault();
    if (!fileInput) {
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);
    try {
      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchFiles();
      setUploadError("");
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload failed");
    }
  };

  const createShare = async (fileId) => {
    const response = await api.post(`/files/${fileId}/share`);
    const link = `${window.location.origin}/api${response.data.url}`;
    await navigator.clipboard.writeText(link);
    alert(`Share link copied: ${link}`);
  };

  const rename = async () => {
    if (!selectedId || !newName) {
      return;
    }
    await api.patch(
      `/files/${selectedId}/rename`,
      { newName },
      { headers: { "x-confirm-action": "CONFIRM_RENAME_FILE" } }
    );
    setNewName("");
    setSelectedId("");
    fetchFiles();
  };

  const removeFile = async (fileId) => {
    if (!window.confirm("Delete file?")) {
      return;
    }
    await api.delete(`/files/${fileId}`, {
      headers: { "x-confirm-action": "CONFIRM_DELETE_FILE" }
    });
    fetchFiles();
  };

  return (
    <div className="space-y-6">
      <form className="rounded-xl border border-slate-700 bg-card p-4" onSubmit={upload}>
        <h2 className="mb-3 text-xl">Upload</h2>
        <input
          type="file"
          onChange={(event) => setFileInput(event.target.files?.[0] || null)}
          className="mb-3 block"
        />
        <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-black">
          Upload
        </button>
      </form>

      <div className="rounded-xl border border-slate-700 bg-card p-4">
        <h2 className="mb-3 text-xl">Files</h2>
        {uploadError ? <p className="mb-3 text-sm text-red-400">{uploadError}</p> : null}
        <ul className="space-y-3">
          {files.map((file) => (
            <li key={file.id} className="rounded-lg border border-slate-700 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>{file.original_name}</p>
                <div className="space-x-2">
                  <button
                    onClick={() => createShare(file.id)}
                    className="rounded bg-slate-700 px-2 py-1 text-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="rounded bg-red-700 px-2 py-1 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {files.length === 0 ? <li className="text-muted">No files yet.</li> : null}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-700 bg-card p-4">
        <h2 className="mb-3 text-xl">Rename</h2>
        <div className="flex gap-2">
          <input
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
            placeholder="File ID"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          />
          <input
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
            placeholder="New name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <button onClick={rename} className="rounded bg-accent px-2 py-1 text-black">
            Rename
          </button>
        </div>
      </div>

      <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={fetchFiles}>
        Refresh
      </button>
    </div>
  );
}

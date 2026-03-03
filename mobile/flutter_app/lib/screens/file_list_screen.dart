import "package:flutter/material.dart";
import "package:file_picker/file_picker.dart";
import "package:flutter/services.dart";
import "dart:io";
import "../services/api_service.dart";
import "media_player_screen.dart";

class FileListScreen extends StatefulWidget {
  const FileListScreen({super.key});

  @override
  State<FileListScreen> createState() => _FileListScreenState();
}

class _FileListScreenState extends State<FileListScreen> {
  final ApiService apiService = ApiService();
  List<dynamic> files = [];
  bool loading = true;
  String error = "";
  String folderPath = "/";
  final TextEditingController folderController = TextEditingController(text: "/");

  Future<void> _loadFiles() async {
    setState(() => loading = true);
    try {
      files = await apiService.listFiles(folderPath: folderPath);
      error = "";
    } catch (e) {
      error = "Unable to load files";
    } finally {
      if (!mounted) return;
      setState(() => loading = false);
    }
  }

  Future<void> _pickAndUpload() async {
    try {
      final result = await FilePicker.platform.pickFiles();
      if (result == null || result.files.single.path == null) {
        return;
      }

      setState(() => loading = true);
      final uploaded = await apiService.uploadFile(
        File(result.files.single.path!),
        folderPath: folderPath
      );
      if (uploaded == null) {
        error = "Upload failed";
      }
      await _loadFiles();
    } catch (e) {
      error = "Upload failed";
      if (!mounted) return;
      setState(() => loading = false);
    }
  }

  Future<void> _createShareLink(String fileId) async {
    final link = await apiService.createShareLink(fileId);
    if (link == null || link["token"] == null) {
      setState(() => error = "Could not create share link");
      return;
    }

    final shareUrl = apiService.buildPublicShareUrl(link["token"] as String);
    await Clipboard.setData(ClipboardData(text: shareUrl));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Share link copied"))
    );
  }

  bool _isVideoFile(Map<String, dynamic> file) {
    final mime = file["mime_type"] as String?;
    return mime != null && mime.startsWith("video/");
  }

  Future<void> _openVideo(String fileId, String title, String mimeType) async {
    final headers = await apiService.videoHeaders();
    if (headers == null || headers["Authorization"] == null) {
      if (!mounted) return;
      setState(() => error = "Cannot open video without authentication");
      return;
    }

    final streamUrl = "${apiService.baseUrl}/media/video/$fileId";
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MediaPlayerScreen(
          title: title,
          streamUrl: streamUrl,
          headers: headers,
        ),
      ),
    );
  }

  Future<void> _deleteFile(String fileId) async {
    try {
      setState(() => loading = true);
      final ok = await apiService.deleteFile(fileId);
      if (!ok) {
        error = "Delete failed";
      }
      await _loadFiles();
    } catch (e) {
      error = "Delete failed";
      if (!mounted) return;
      setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadFiles();
  }

  @override
  Widget build(BuildContext context) {
    final hasFolder = folderPath.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text("Files")),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: folderController,
              decoration: const InputDecoration(labelText: "Folder path", border: OutlineInputBorder()),
              onChanged: (value) {
                folderPath = value.trim().isEmpty ? "/" : value.trim();
              },
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                if (hasFolder) {
                  _loadFiles();
                }
              },
              icon: const Icon(Icons.filter_list),
              label: const Text("Filter folder")
            )
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _pickAndUpload,
        child: const Icon(Icons.upload_file),
      ),
      body: Column(
        children: [
          if (error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(error, style: const TextStyle(color: Colors.redAccent)),
            ),
          Expanded(
            child: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadFiles,
              child: ListView.builder(
                itemCount: files.length,
                itemBuilder: (context, index) {
                  final file = files[index] as Map<String, dynamic>;
                  final isVideo = _isVideoFile(file);
                  return ListTile(
                    title: Text(file["original_name"] ?? ""),
                    subtitle: Text(file["mime_type"] ?? ""),
                    leading: Icon(isVideo ? Icons.movie : Icons.insert_drive_file),
                    trailing: Wrap(
                      spacing: 8,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.link),
                          onPressed: () => _createShareLink(file["id"]),
                        ),
                        if (isVideo)
                          IconButton(
                            icon: const Icon(Icons.play_circle_fill),
                            onPressed: () => _openVideo(
                              file["id"] as String,
                              file["original_name"] ?? "Video",
                              file["mime_type"] ?? "video/mp4"
                            ),
                          ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _deleteFile(file["id"]),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

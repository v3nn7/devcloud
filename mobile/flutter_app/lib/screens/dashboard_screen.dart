import "package:flutter/material.dart";
import "../services/api_service.dart";
import "file_list_screen.dart";

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService apiService = ApiService();
  Map<String, dynamic>? data;
  String error = "";

  Future<void> _loadData() async {
    data = await apiService.dashboard();
    error = data == null ? "Session expired. Please login again." : "";
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _logout() async {
    await apiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil("/login", (route) => false);
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    final used = data?["storage"]?["usedBytes"] ?? 0;
    final sessions = data?["activeSessions"] ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text("DevCloud Dashboard"),
        actions: [
          IconButton(
            icon: const Icon(Icons.folder_open),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const FileListScreen()),
            )
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData
          )
        ],
      ),
      body: error.isNotEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(error, style: const TextStyle(color: Colors.redAccent)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushReplacementNamed("/login"),
                    child: const Text("Go to login")
                  )
                ],
              ),
            )
          : data == null
              ? const Center(child: CircularProgressIndicator())
              : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Card(
                  child: ListTile(title: const Text("Storage"), subtitle: Text("Used: ${(used / 1024 / 1024).toStringAsFixed(1)} MB")),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(title: const Text("Active sessions"), subtitle: Text("$sessions")),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: _loadData,
                      icon: const Icon(Icons.refresh),
                      label: const Text("Refresh")
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout),
                      label: const Text("Logout")
                    ),
                  ],
                ),
              ]),
            ),
    );
  }
}

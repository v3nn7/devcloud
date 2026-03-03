import "package:flutter/material.dart";
import "services/api_service.dart";
import "screens/login_screen.dart";
import "screens/dashboard_screen.dart";
import "screens/file_list_screen.dart";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final hasToken = await ApiService().isAuthenticated();
  runApp(DevCloudApp(hasToken: hasToken));
}

class DevCloudApp extends StatelessWidget {
  final bool hasToken;

  const DevCloudApp({super.key, required this.hasToken});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "DevCloud",
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0B1020),
        colorScheme: ColorScheme.dark(primary: const Color(0xFF4F8CFF))
      ),
      home: hasToken ? const DashboardScreen() : const LoginScreen(),
      routes: {
        "/login": (context) => const LoginScreen(),
        "/dashboard": (context) => const DashboardScreen(),
        "/files": (context) => const FileListScreen(),
      },
    );
  }
}

import "package:flutter/material.dart";
import "../services/api_service.dart";

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String _error = "";

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = "";
    });
    final success = await ApiService().login(_email.text, _password.text);
    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushReplacementNamed("/dashboard");
    } else {
      setState(() {
        _error = "Invalid credentials or server error";
      });
    }
    setState(() {
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text("DevCloud", style: TextStyle(fontSize: 36, color: Color(0xFF4F8CFF))),
            const SizedBox(height: 20),
            TextField(controller: _email, decoration: const InputDecoration(labelText: "Email")),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              decoration: const InputDecoration(labelText: "Password"),
              obscureText: true,
            ),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _loading ? null : _submit, child: const Text("Log in")),
            if (_loading) const Padding(padding: EdgeInsets.only(top: 12), child: CircularProgressIndicator()),
            if (_error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error))
          ]),
        ),
      ),
    );
  }
}

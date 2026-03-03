import "dart:convert";
import "dart:io";
import "package:http/http.dart" as http;
import "package:shared_preferences/shared_preferences.dart";

class ApiService {
  final String baseUrl;

  ApiService({this.baseUrl = "http://localhost:4000/api"});

  Future<void> _storeTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("dc_access_token", accessToken);
    await prefs.setString("dc_refresh_token", refreshToken);
  }

  Future<Map<String, String>> _authHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("dc_access_token");
    if (token == null) {
      return {"Content-Type": "application/json"};
    }
    return {"Content-Type": "application/json", "Authorization": "Bearer $token"};
  }

  Future<String?> _tokenRefresh() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString("dc_refresh_token");
    if (refreshToken == null) {
      return null;
    }

    final response = await http.post(
      Uri.parse("$baseUrl/auth/refresh"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"refreshToken": refreshToken})
    );
    if (response.statusCode != 200) {
      return null;
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    await _storeTokens(data["accessToken"] as String, data["refreshToken"] as String);
    return data["accessToken"] as String;
  }

  Future<http.Response> _authorizedRequest(
    Future<http.Response> Function(Map<String, String>) request
  ) async {
    final headers = await _authHeaders();
    http.Response response = await request(headers);

    if (response.statusCode == 401) {
      final refreshed = await _tokenRefresh();
      if (refreshed == null) {
        return response;
      }
      final refreshedHeaders = await _authHeaders();
      response = await request(refreshedHeaders);
    }

    return response;
  }

  Future<Map<String, String>> _basicHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("dc_access_token");
    if (token == null) {
      return {"Content-Type": "application/json"};
    }
    return {"Content-Type": "application/json", "Authorization": "Bearer $token"};
  }

  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse("$baseUrl/auth/login"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email, "password": password})
    );
    if (response.statusCode != 200) {
      return false;
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    await _storeTokens(data["accessToken"] as String, data["refreshToken"] as String);
    return true;
  }

  Future<List<dynamic>> listFiles({String folderPath = "/"}) async {
    final encodedPath = Uri.encodeQueryComponent(folderPath);
    final response = await _authorizedRequest(
      (headers) => http.get(Uri.parse("$baseUrl/files?folderPath=$encodedPath"), headers: headers)
    );

    if (response.statusCode == 401) {
      return [];
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data["files"] as List<dynamic>;
  }

  Future<Map<String, dynamic>?> createShareLink(String fileId) async {
    final response = await _authorizedRequest(
      (headers) => http.post(Uri.parse("$baseUrl/files/$fileId/share"), headers: headers)
    );

    if (response.statusCode != 200) {
      return null;
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  String buildPublicShareUrl(String token) {
    return "$baseUrl/files/shared/$token";
  }

  Future<Map<String, dynamic>?> dashboard() async {
    final response = await _authorizedRequest(
      (headers) => http.get(Uri.parse("$baseUrl/dashboard/overview"), headers: headers)
    );

    if (response.statusCode != 200) {
      return null;
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<bool> deleteFile(String fileId) async {
    final headers = await _authHeaders();
    final response = await http.delete(
      Uri.parse("$baseUrl/files/$fileId"),
      headers: {
        ...headers,
        "x-confirm-action": "CONFIRM_DELETE_FILE"
      }
    );
    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>?> uploadFile(File file, {String folderPath = "/"}) async {
    final headers = await _basicHeaders();
    final request = http.MultipartRequest("POST", Uri.parse("$baseUrl/files/upload"))
      ..files.add(await http.MultipartFile.fromPath("file", file.path));
    request.fields["folderPath"] = folderPath;
    request.headers.addAll(headers);

    final response = await http.Response.fromStream(await request.send());
    if (response.statusCode == 201) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  }

  Future<Map<String, String>> videoHeaders() async {
    final headers = await _authHeaders();
    final token = headers["Authorization"];

    if (token == null) {
      return headers;
    }

    final probe = await http.get(
      Uri.parse("$baseUrl/auth/me"),
      headers: headers
    );
    if (probe.statusCode != 401) {
      return headers;
    }

    final refreshed = await _tokenRefresh();
    if (refreshed == null) {
      await logout();
      return {"Content-Type": "application/json"};
    }

    return await _authHeaders();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("dc_access_token");
    await prefs.remove("dc_refresh_token");
  }

  Future<bool> isAuthenticated() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("dc_access_token");
    return token != null && token.isNotEmpty;
  }
}

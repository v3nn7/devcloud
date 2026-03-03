import "package:flutter/material.dart";
import "package:video_player/video_player.dart";

class MediaPlayerScreen extends StatefulWidget {
  final String streamUrl;
  final Map<String, String> headers;
  final String title;

  const MediaPlayerScreen({
    super.key,
    required this.streamUrl,
    required this.headers,
    required this.title
  });

  @override
  State<MediaPlayerScreen> createState() => _MediaPlayerScreenState();
}

class _MediaPlayerScreenState extends State<MediaPlayerScreen> {
  VideoPlayerController? _controller;
  bool _loading = true;
  String _error = "";

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    try {
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.streamUrl),
        httpHeaders: widget.headers
      );
      await _controller!.initialize();
      await _controller!.play();
      if (!mounted) return;
      setState(() => _loading = false);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _controller?.pause();
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlayback() {
    if (_controller == null) {
      return;
    }
    setState(() {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
      } else {
        _controller!.play();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error.isNotEmpty || _controller == null || !_controller!.value.isInitialized) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: Center(
          child: Text(_error.isEmpty ? "Unable to load video stream." : _error),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),
              const SizedBox(height: 12),
              IconButton(
                icon: Icon(_controller!.value.isPlaying ? Icons.pause : Icons.play_arrow),
                iconSize: 48,
                onPressed: _togglePlayback,
              )
            ],
          ),
        ),
      ),
    );
  }
}

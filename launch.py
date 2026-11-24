"""Launch Causal Power Lab locally using only the Python standard library."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


def main():
    root = Path(__file__).resolve().parent
    if not (root / "index.html").is_file():
        raise SystemExit("index.html not found. Keep launch.py in the project folder.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    # Let the OS choose a free port, avoiding conflicts with other local apps.
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        url = f"http://127.0.0.1:{server.server_port}/"
        print(f"Causal Power Lab: {url}", flush=True)
        print("Press Ctrl+C to stop the local server.", flush=True)

        def open_browser():
            try:
                if not webbrowser.open(url):
                    print(f"Open {url} in your browser.", flush=True)
            except Exception:
                print(f"Open {url} in your browser.", flush=True)

        threading.Thread(target=open_browser, daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()

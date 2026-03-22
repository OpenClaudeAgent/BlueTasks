//! BlueTasks desktop shell: spawns the embedded Node server (Express + SQLite) and loads the UI from it.

use std::io::Write;
use std::net::TcpStream;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent};

const SERVER_PORT: u16 = 8787;
const STARTUP_TIMEOUT_MS: u64 = 45_000;

/// `path_resolver.resource_dir()` is e.g. `BlueTasks.app/Contents/Resources`.
/// Bundled files from `src-tauri/resources/` are copied to `Resources/resources/` (extra `resources` segment).
/// In `tauri dev`, layouts may expose assets directly under `resource_dir`.
fn asset_pack_root(resource_dir: &std::path::Path) -> std::path::PathBuf {
    let nested = resource_dir.join("resources");
    #[cfg(windows)]
    let node_candidate = nested.join("node").join("node.exe");
    #[cfg(not(windows))]
    let node_candidate = nested.join("node").join("bin").join("node");

    if node_candidate.is_file() {
        nested
    } else {
        #[cfg(windows)]
        let flat = resource_dir.join("node").join("node.exe");
        #[cfg(not(windows))]
        let flat = resource_dir.join("node").join("bin").join("node");
        if flat.is_file() {
            resource_dir.to_path_buf()
        } else {
            nested
        }
    }
}

fn node_binary_path(assets_root: &std::path::Path) -> std::path::PathBuf {
    #[cfg(windows)]
    {
        assets_root.join("node").join("node.exe")
    }
    #[cfg(not(windows))]
    {
        assets_root.join("node").join("bin").join("node")
    }
}

fn wait_for_server(port: u16, timeout_ms: u64) -> bool {
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);
    while std::time::Instant::now() < deadline {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(100));
    }
    false
}

fn spawn_embedded_server(app: &AppHandle) -> Result<Child, String> {
    let resolver = app.path();
    let resource_dir = resolver
        .resource_dir()
        .map_err(|e| format!("resource_dir: {e}"))?;
    let assets_root = asset_pack_root(&resource_dir);
    let runtime_home = assets_root.join("bluetasks-runtime");
    let node_bin = node_binary_path(&assets_root);
    let entry = runtime_home
        .join("server")
        .join("dist")
        .join("docker-bundle.cjs");

    if !node_bin.is_file() {
        return Err(format!(
            "Node runtime not found at {} — run `npm run prep` in the desktop/ folder (from repo root: `npm run desktop:prep`).",
            node_bin.display()
        ));
    }
    if !entry.is_file() {
        return Err(format!(
            "Server bundle not found at {} — run `npm run prep` after `npm run build`.",
            entry.display()
        ));
    }

    let data_dir = resolver
        .app_local_data_dir()
        .map_err(|e| format!("app_local_data_dir: {e}"))?
        .join("BlueTasks")
        .join(".data");
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("create data dir: {e}"))?;

    // Prefer canonical path for Node; fall back if the OS refuses (e.g. some bundle layouts).
    let bluetasks_home = runtime_home
        .canonicalize()
        .unwrap_or_else(|_| runtime_home.clone());
    let home_str = bluetasks_home
        .to_str()
        .ok_or("BLUETASKS_HOME path is not valid UTF-8")?;
    let data_str = data_dir
        .to_str()
        .ok_or("BLUETASKS_DATA_DIR path is not valid UTF-8")?;

    Command::new(&node_bin)
        .current_dir(&bluetasks_home)
        .env("BLUETASKS_HOME", home_str)
        .env("BLUETASKS_DATA_DIR", data_str)
        .env("HOST", "127.0.0.1")
        .env("PORT", SERVER_PORT.to_string())
        .env("NODE_ENV", "production")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .arg(&entry)
        .spawn()
        .map_err(|e| format!("failed to spawn Node: {e}"))
}

pub fn run() {
    let child_holder: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let child_for_setup = Arc::clone(&child_holder);
    let child_for_run = Arc::clone(&child_holder);

    let app = tauri::Builder::default()
        .setup(move |app| {
            match spawn_embedded_server(app.handle()) {
                Ok(proc) => {
                    let mut guard = child_for_setup
                        .lock()
                        .unwrap_or_else(|poisoned| poisoned.into_inner());
                    *guard = Some(proc);
                }
                Err(e) => {
                    eprintln!("[BlueTasks] {e}");
                    let mut stderr = std::io::stderr();
                    let _ = writeln!(
                        stderr,
                        "[BlueTasks] Fix: from repo root run `npm run build` then `npm run desktop:prep`, then `cd desktop && npm run tauri dev`."
                    );
                    return Err(e.into());
                }
            }

            if !wait_for_server(SERVER_PORT, STARTUP_TIMEOUT_MS) {
                let msg = format!(
                    "BlueTasks server did not accept connections on 127.0.0.1:{} within {} ms.",
                    SERVER_PORT, STARTUP_TIMEOUT_MS
                );
                eprintln!("[BlueTasks] {msg}");
                return Err(msg.into());
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |_app_handle, event| {
        if let RunEvent::Exit = event {
            if let Ok(mut guard) = child_for_run.lock() {
                if let Some(mut child) = guard.take() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
        }
    });
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod svelte;
mod schema;

fn main() {
  tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![
        svelte::import_export::save_export
      ])
    .plugin(tauri_plugin_store::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

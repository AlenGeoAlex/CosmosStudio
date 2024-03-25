use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::Path;

use tauri::command;
use zip::{CompressionMethod, ZipWriter};
use zip::write::FileOptions;

use crate::schema::import_export::ExportOptions;

#[command]
pub async  fn save_export(body : ExportOptions) -> Result<String, String>{

    let path = Path::new(&body.export_path);
    let path_result = path.try_exists();
    if path_result.is_err() || !path_result.unwrap(){
        return Err("file-system-error".into());
    }

    if !path.is_dir(){
        return Err("file-system-error".into());
    }

    let as_zip = body.is_zip
        .unwrap();


    if body.export_type == "json" {
        if !as_zip{
            let mut insert_names : Vec<String> = Vec::new();
            for each_file in body.data {
                let mut file_name = each_file.0;
                if !file_name.ends_with(".json"){
                    file_name = file_name +".json";
                }
                let file_name_clone = file_name.clone();
                let buf = path.join(file_name);
                let result = fs::write(buf, each_file.1);
                if result.is_err() {
                    return Err(result.err().unwrap().to_string().into());
                }else{
                    insert_names.push(file_name_clone)
                }
            }
        }else {
            let mut zip_name = body.zip_name.unwrap_or_else(|| {
                "export.zip".to_string()
            });

            if !zip_name.ends_with(".zip"){
                zip_name = zip_name+ ".zip";
            }

            let zip_path = path.join(&zip_name);
            let file_create_result = File::create(zip_path);
            if file_create_result.is_err(){
                return Err("file-system-error".into());
            }
            let zip_file = file_create_result.unwrap();
            let mut zip = ZipWriter::new(zip_file);
            let zip_options = FileOptions::default()
                .compression_method(CompressionMethod::Zstd)
                .unix_permissions(0o755);

            for each_file in body.data {
                let mut file_name = each_file.0;
                if !file_name.ends_with(".json"){
                    file_name = file_name +".json";
                }

                let res = zip.start_file(file_name, zip_options);
                if res.is_err(){
                    return Err("error-writing-zip".into());
                }
                let res = zip.write_all(each_file.1.as_bytes());

                if res.is_err() {
                    return Err("error-creating-zip".into());
                }

            }

            let res = zip.finish();
            return if res.is_err(){
                Err("failed-to-generate-zip".into())
            }else{
                return Ok("success".into())
            }
        }
    }else if body.export_type == "csv" {

    }else{
       return Err("unknown".into());
    }
    return Ok("success".into())
}
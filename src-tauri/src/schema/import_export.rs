use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ExportOptions {
    pub export_type : String,
    pub export_path : String,
    pub is_zip : Option<bool>,
    pub zip_name : Option<String>,
    pub data : HashMap<String, String>
}
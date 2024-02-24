#![allow(dead_code)]

use super::pushable;
use super::u32_zip::u32_copy_zip;
use super::unroll;
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;

pub const DELIMITER: &str = "=";

pub fn hash_id(identifier: &str, index: Option<&str>, value: u32) -> String {
    // TODO: ensure there's no DELIMITER in identifier, index, or value
    match index {
        None => format!("{identifier}{DELIMITER}{value}"),
        Some(index) => format!("{identifier}_{index}{DELIMITER}{value}"),
    }
}

// TODO: Implememnt actor class and copy over rest of this file from the javascript bitvm
// implementation

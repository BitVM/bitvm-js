use crate::opcodes::{
    u32_std::{u32_equalverify, u32_roll},
    unroll,
};

use super::pushable;
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;

pub fn u256_equalverify() -> ScriptBuf {
    bitcoin_script! {
        <unroll(8, |i| bitcoin_script! {
            <u32_roll(8 - i)>
            u32_equalverify
        })>
    }
}

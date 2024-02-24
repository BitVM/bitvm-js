#![allow(dead_code)]

use crate::opcodes::pseudo::OP_256MUL;

use super::pushable;
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;

pub fn u32_push(value: u32) -> ScriptBuf {
    bitcoin_script! {
        ~(value & 0xff000000) >> 24~
        ~(value & 0x00ff0000) >> 16~
        ~(value & 0x0000ff00) >> 8~
        <value & 0x000000ff>
    }
}

pub fn u32_equalverify() -> ScriptBuf {
    bitcoin_script!{
    <4>
    OP_ROLL
    OP_EQUALVERIFY
    <3>
    OP_ROLL
    OP_EQUALVERIFY
    OP_ROT
    OP_EQUALVERIFY
    OP_EQUALVERIFY
    }
}

pub fn u32_equal() -> ScriptBuf {
    bitcoin_script!{
    <4>
    OP_ROLL
    OP_EQUAL OP_TOALTSTACK
    <3>
    OP_ROLL
    OP_EQUAL OP_TOALTSTACK
    OP_ROT
    OP_EQUAL OP_TOALTSTACK
    OP_EQUAL
    OP_FROMALTSTACK OP_BOOLAND
    OP_FROMALTSTACK OP_BOOLAND
    OP_FROMALTSTACK OP_BOOLAND
    }
}

pub fn u32_notequal() -> ScriptBuf {
    bitcoin_script!{
    <4>
    OP_ROLL
    OP_EQUAL OP_NOT OP_TOALTSTACK
    <3>
    OP_ROLL
    OP_EQUAL OP_NOT OP_TOALTSTACK
    OP_ROT
    OP_EQUAL OP_NOT OP_TOALTSTACK
    OP_EQUAL OP_NOT
    OP_FROMALTSTACK OP_BOOLOR
    OP_FROMALTSTACK OP_BOOLOR
    OP_FROMALTSTACK OP_BOOLOR
    }
}

pub fn u32_toaltstack() -> ScriptBuf {
    bitcoin_script!{
    OP_TOALTSTACK
    OP_TOALTSTACK
    OP_TOALTSTACK
    OP_TOALTSTACK
    }
}

pub fn u32_fromaltstack() -> ScriptBuf {
    bitcoin_script!{
    OP_FROMALTSTACK
    OP_FROMALTSTACK
    OP_FROMALTSTACK
    OP_FROMALTSTACK
    }
}

pub fn u32_drop() -> ScriptBuf {
    bitcoin_script!{
    OP_2DROP
    OP_2DROP
    }
}

pub fn u32_roll(a: u32) -> ScriptBuf {
    let a = (a + 1) * 4 - 1;
    bitcoin_script!{
        <a> OP_ROLL
        <a> OP_ROLL
        <a> OP_ROLL
        <a> OP_ROLL
    }
}

pub fn u32_pick(a: u32) -> ScriptBuf {
    let a = (a + 1) * 4 - 1;
    bitcoin_script!{
        <a> OP_PICK
        <a> OP_PICK
        <a> OP_PICK
        <a> OP_PICK
    }
}


pub fn u32_compress() -> ScriptBuf {
    bitcoin_script! {
    OP_SWAP
    OP_ROT
    <3>
    OP_ROLL
    OP_DUP
    <127>
    OP_GREATERTHAN
    OP_IF
        <128>
        OP_SUB
        <1>
    OP_ELSE
        <0>
    OP_ENDIF
    OP_TOALTSTACK
    OP_256MUL
    OP_ADD
    OP_256MUL
    OP_ADD
    OP_256MUL
    OP_ADD
    OP_FROMALTSTACK
    OP_IF
        OP_NEGATE
    OP_ENDIF
    }
}


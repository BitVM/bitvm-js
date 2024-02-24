#![allow(dead_code)]

use super::pushable;
use super::unroll;
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;

pub fn u32_rrot16() -> ScriptBuf {
    bitcoin_script! {
    OP_2SWAP
    }
}

pub fn u32_rrot8() -> ScriptBuf {
    bitcoin_script! {
    3 OP_ROLL
    3 OP_ROLL
    3 OP_ROLL
    }
}

pub fn u8_rrot12() -> ScriptBuf {
    bitcoin_script! {
    0
    OP_TOALTSTACK

    <unroll(4, |i| bitcoin_script!{
        OP_DUP
        127
        OP_GREATERTHAN
        OP_IF
            128
            OP_SUB
            OP_FROMALTSTACK
            ~8 >> i~
            OP_ADD
            OP_TOALTSTACK
        OP_ENDIF

        OP_DUP
        OP_ADD
    })>

    OP_FROMALTSTACK
    }
}

///
/// Right Rotation by 12 bits
///
pub fn u32_rrot12() -> ScriptBuf {
    bitcoin_script! {
              u8_rrot12
    2 OP_ROLL u8_rrot12
    4 OP_ROLL u8_rrot12
    6 OP_ROLL u8_rrot12

    //
    // Glue it all together
    //

    5 OP_ROLL
    6 OP_ROLL
      OP_ADD
      OP_SWAP

    6 OP_ROLL
      OP_ADD

      OP_ROT
    3 OP_ROLL
      OP_ADD

    4 OP_ROLL

    4 OP_ROLL
      OP_ADD
    }
}

pub fn u8_rrot7(i: u32) -> ScriptBuf {
    bitcoin_script! {
    <i> OP_ROLL
       OP_DUP
    127
    OP_GREATERTHAN
    OP_IF
        128
        OP_SUB
        1
    OP_ELSE
        0
    OP_ENDIF
    }
}

//
// Right Rotation by 7 bits
//
pub fn u32_rrot7() -> ScriptBuf {
    bitcoin_script! {

    // First Byte
    <u8_rrot7(0)>

    // Second byte
    <u8_rrot7(2)>

    OP_SWAP
    OP_DUP
    OP_ADD
    OP_ROT
    OP_ADD
    OP_SWAP

    // Third byte
    <u8_rrot7(3)>

    OP_SWAP
    OP_DUP
    OP_ADD
    OP_ROT
    OP_ADD
    OP_SWAP

    // Fourth byte
    <u8_rrot7(4)>

    OP_SWAP
    OP_DUP
    OP_ADD
    OP_ROT
    OP_ADD
    OP_SWAP

    // Close the circle
    4 OP_ROLL
      OP_DUP
      OP_ADD
      OP_ADD

    OP_SWAP
    OP_2SWAP
    OP_SWAP
    }
}
#![allow(non_snake_case)]
#![allow(dead_code)]
use crate::opcodes::unroll;

use super::pushable;
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;


/// OP_4PICK
/// The 4 items n back in the stack are copied to the top.
pub fn OP_4PICK() -> ScriptBuf {
    bitcoin_script! { OP_ADD
    OP_DUP  OP_PICK OP_SWAP
    OP_DUP  OP_PICK OP_SWAP
    OP_DUP  OP_PICK OP_SWAP
    OP_1SUB OP_PICK }
}

/// OP_4ROLL
/// The 4 items n back in the stack are moved to the top.
pub fn OP_4ROLL() -> ScriptBuf {
    bitcoin_script! {
        <4> OP_ADD
        OP_DUP  OP_ROLL OP_SWAP
        OP_DUP  OP_ROLL OP_SWAP
        OP_DUP  OP_ROLL OP_SWAP
        OP_1SUB OP_ROLL
    }
}

pub fn OP_4DUP() -> ScriptBuf {
    bitcoin_script! {
    OP_2OVER OP_2OVER
    }
}

pub fn OP_4DROP() -> ScriptBuf {
    bitcoin_script! {
        OP_2DROP OP_2DROP
    }
}

pub fn OP_4SWAP() -> ScriptBuf {
    bitcoin_script! {
    <7> OP_ROLL <7> OP_ROLL
    <7> OP_ROLL <7> OP_ROLL
    }
}

/// Puts the top 4 items onto the top of the alt stack. Removes them from the main stack.
pub fn OP_4TOALTSTACK() -> ScriptBuf {
    bitcoin_script! {
        OP_TOALTSTACK OP_TOALTSTACK OP_TOALTSTACK OP_TOALTSTACK
    }
}

/// Puts the top 4 items from the altstack onto the top of the main stack. Removes them from the alt stack.
pub fn OP_4FROMALTSTACK() -> ScriptBuf {
    bitcoin_script! {
        OP_FROMALTSTACK OP_FROMALTSTACK OP_FROMALTSTACK OP_FROMALTSTACK
    }
}

///
/// Multiplication by Powers of 2
///
/// The input is multiplied by 2
pub fn OP_2MUL() -> ScriptBuf {
    bitcoin_script! {
        OP_DUP OP_ADD
    }
}

/// The input is multiplied by 4
pub fn OP_4MUL() -> ScriptBuf {
    bitcoin_script! {
        OP_DUP OP_ADD OP_DUP OP_ADD
    }
}

/// The input is multiplied by 2**k
pub fn op_2k_mul(k: u32) -> ScriptBuf {
    bitcoin_script! {
        <unroll(k, |_| OP_2MUL())>
    }
}

/// The input is multiplied by 16
pub fn OP_16MUL() -> ScriptBuf {
    bitcoin_script! {
        OP_DUP OP_ADD OP_DUP OP_ADD
        OP_DUP OP_ADD OP_DUP OP_ADD
    }
}

/// The input is multiplied by 256
pub fn OP_256MUL() -> ScriptBuf {
    bitcoin_script! {
        OP_DUP OP_ADD OP_DUP OP_ADD
        OP_DUP OP_ADD OP_DUP OP_ADD
        OP_DUP OP_ADD OP_DUP OP_ADD
        OP_DUP OP_ADD OP_DUP OP_ADD
    }
}

#![allow(dead_code)]
use bitcoin::ScriptBuf;
use bitcoin_script::bitcoin_script;
use super::pushable;

pub fn u32_zip(mut a: u32, mut b: u32) -> ScriptBuf {
    if a > b {
        (a, b) = (b, a);
    }

    a = (a + 1) * 4 - 1;
    b = (b + 1) * 4 - 1;

    bitcoin_script! {
        <a+0> OP_ROLL <b> OP_ROLL
        <a+1> OP_ROLL <b> OP_ROLL
        <a+2> OP_ROLL <b> OP_ROLL
        <a+3> OP_ROLL <b> OP_ROLL
    }
}

pub fn u32_copy_zip(a: u32, b: u32) -> ScriptBuf {
	if a < b {
        _u32_copy_zip(a, b)
    } else {
        _u32_zip_copy(b, a)
    }
}

pub fn _u32_copy_zip(mut a: u32, mut b: u32) -> ScriptBuf {
    assert!(a < b);

    a = (a + 1) * 4 - 1;
    b = (b + 1) * 4 - 1;

    bitcoin_script! {
        <a+0> OP_PICK <b+1> OP_ROLL
        <a+1> OP_PICK <b+2> OP_ROLL
        <a+2> OP_PICK <b+3> OP_ROLL
        <a+3> OP_PICK <b+4> OP_ROLL
    }
}

pub fn _u32_zip_copy(mut a: u32, mut b: u32) -> ScriptBuf {
    assert!(a < b);

    a = (a + 1) * 4 - 1;
    b = (b + 1) * 4 - 1;
    bitcoin_script! {
        <a+0> OP_ROLL <b> OP_PICK
        <a+1> OP_ROLL <b> OP_PICK
        <a+2> OP_ROLL <b> OP_PICK
        <a+3> OP_ROLL <b> OP_PICK
    }
}


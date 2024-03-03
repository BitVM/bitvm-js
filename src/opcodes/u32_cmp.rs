#![allow(dead_code)]

use crate::opcodes::pseudo::OP_4DUP; 

use super::pushable;
use bitcoin::{opcodes::all::{OP_GREATERTHAN, OP_LESSTHAN}, Opcode, ScriptBuf};
use bitcoin_script::bitcoin_script;

// ((((((A_0 > B_0) && A_1 == B_1) || A_1 > B_1) && A_2 == B_2) || A_2 > B_2) && A_3 == B_3) || A_3 > B_3
fn u32_cmp(opcode : Opcode) -> ScriptBuf {
    bitcoin_script! {
	    <4>
	    OP_ROLL
	    OP_SWAP
	    <opcode>
	    OP_SWAP
	    <4>
	    OP_ROLL
	    OP_2DUP
	    OP_EQUAL
	    <3>
	    OP_ROLL
	    OP_BOOLAND
	    OP_SWAP
	    OP_ROT
	    <opcode>
	    OP_BOOLOR
	    OP_SWAP
	    <3>
	    OP_ROLL
	    OP_2DUP
	    OP_EQUAL
	    <3>
	    OP_ROLL
	    OP_BOOLAND
	    OP_SWAP
	    OP_ROT
	    <opcode>
	    OP_BOOLOR
	    OP_SWAP
	    OP_ROT
	    OP_2DUP
	    OP_EQUAL
	    <3>
	    OP_ROLL
	    OP_BOOLAND
	    OP_SWAP
	    OP_ROT
	    <opcode>
	    OP_BOOLOR
    }
}

// A_3 <> B_3 || (A_3 == B_3 && (A_2 <> B_2 || (A_2 == B_2 && (A_1 <> B_1 || (A_1 == B_1 && A_0 <> B_0)))))
pub fn u32_lessthan() -> ScriptBuf {
    u32_cmp(OP_LESSTHAN)
}

pub fn u32_greaterthan() -> ScriptBuf {
    u32_cmp(OP_GREATERTHAN)
}

fn u32_cmpeq(opcode: Opcode) -> ScriptBuf {
    bitcoin_script! {
	OP_4DUP
	<8>
	OP_PICK
	OP_EQUAL
	OP_SWAP
	<9>
	OP_PICK
	OP_EQUAL
	OP_BOOLAND
	OP_SWAP	
	<9>
	OP_PICK
	OP_EQUAL
	OP_BOOLAND
	OP_SWAP	
	<9>
	OP_PICK
	OP_EQUAL
	OP_BOOLAND
	OP_TOALTSTACK
	<u32_cmp(opcode)>
	OP_FROMALTSTACK
	OP_BOOLOR
    }
}

pub fn u32_lessthanorequal() -> ScriptBuf {
    u32_cmpeq(OP_LESSTHAN)
}

pub fn u32_greaterthanorequal() -> ScriptBuf {
    u32_cmpeq(OP_GREATERTHAN)
}

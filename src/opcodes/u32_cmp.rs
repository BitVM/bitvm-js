#![allow(dead_code)]

use crate::opcodes::pseudo::OP_4DUP; 

use super::pushable;
use bitcoin::{opcodes::all::{OP_GREATERTHAN, OP_LESSTHAN}, Opcode, ScriptBuf as Script};
use bitcoin_script::bitcoin_script as script;

// ((((((A_0 > B_0) && A_1 == B_1) || A_1 > B_1) && A_2 == B_2) || A_2 > B_2) && A_3 == B_3) || A_3 > B_3
fn u32_cmp(comparator : Opcode) -> Script {
    script! {
	    <4>
	    OP_ROLL
	    OP_SWAP
	    <comparator>
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
	    <comparator>
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
	    <comparator>
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
	    <comparator>
	    OP_BOOLOR
    }
}

/// Compares the top two stack items. 
/// Returns 1 if the top item is less than the second-to-top item
/// Otherwise, returns 0
pub fn u32_lessthan() -> Script {
	// A_3 <> B_3 || (A_3 == B_3 && (A_2 <> B_2 || (A_2 == B_2 && (A_1 <> B_1 || (A_1 == B_1 && A_0 <> B_0)))))
    u32_cmp(OP_LESSTHAN)
}

/// Compares the top two stack items. 
/// Returns 1 if the top item is greater than the second-to-top item
/// Otherwise, returns 0
pub fn u32_greaterthan() -> Script {
    u32_cmp(OP_GREATERTHAN)
}

fn u32_cmpeq(comparator : Opcode) -> Script {
    script! {
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
	<u32_cmp(comparator)>
	OP_FROMALTSTACK
	OP_BOOLOR
    }
}

/// Compares the top two stack items. 
/// Returns 1 if the top item is less than or equal to the second-to-top item
/// Otherwise, returns 0
pub fn u32_lessthanorequal() -> Script {
    u32_cmpeq(OP_LESSTHAN)
}

/// Compares the top two stack items. 
/// Returns 1 if the top item is greater than or equal to the second-to-top item
/// Otherwise, returns 0
pub fn u32_greaterthanorequal() -> Script {
    u32_cmpeq(OP_GREATERTHAN)
}

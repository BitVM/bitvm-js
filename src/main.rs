mod opcodes;
use bitcoin::blockdata::opcodes::all::{OP_ADD, OP_PICK, OP_SWAP};
use bitcoin::{blockdata::script::Script, Opcode};
use bitcoin_script::bitcoin_script;
use opcodes::pushable::{self, Pushable};
use opcodes::pseudo::unroll;


pub fn OP_7ROLL() -> Vec<Opcode> {
    vec![OP_SWAP, OP_ADD, OP_PICK]
}

pub fn OP_4ROLL() -> bitcoin::ScriptBuf {
    bitcoin_script! {OP_7ROLL OP_PICK }
}

fn main() {
    let y = 13;
    //let my_script = bitcoin_script! {
    //    <(|x: i32| -> i32 {x + y} )(7)> OP_4ROLL
    //};
    
    let my_script = bitcoin_script!{
        <unroll(18, |i| bitcoin_script!{ OP_4ROLL <i> <y>})>
    };

    //let my_script = bitcoin_script!{OP_4ROLL};

    println!("{:?}", my_script);
}

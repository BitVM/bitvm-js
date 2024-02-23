mod opcodes;
use bitcoin_script::bitcoin_script;
use opcodes::pushable;
use opcodes::pseudo::OP_4PICK;

use crate::opcodes::pseudo::op_2k_mul;



fn main() {
    //let y = 13;
    //let my_script = bitcoin_script! {
    //    <(|x: i32| -> i32 {x + y} )(7)> OP_4ROLL
    //};
    
    //let my_script = bitcoin_script!{
    //    <unroll(18, |i| bitcoin_script!{ OP_4ROLL <i> <y>})>
    //};

    let my_script = bitcoin_script!{
        <op_2k_mul(8)>
        OP_4PICK
    };

    //let my_script = bitcoin_script!{OP_4ROLL};

    println!("{:?}", my_script);
}

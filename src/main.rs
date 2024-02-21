mod opcodes;
use crate::opcodes::{Opcode, OP_ADD};
use crate::opcodes::pseudo::{OP_4PICK, OP_2MUL};

fn main() {
    println!("{:?}", const_compose!([1,2,3,4, OP_ADD]));
    const MY_VAR : i32 = 7;
    println!("{:?}", const_compose!([OP_4PICK, OP_2MUL, OP_ADD, MY_VAR]));
    println!("{:?}", opcodes::pseudo::OP_4PICK);
}

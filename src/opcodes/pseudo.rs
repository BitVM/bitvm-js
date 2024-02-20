
use super::{Opcode, OP_4, OP_ADD, OP_DUP, OP_PICK, OP_SWAP, OP_1SUB, OP_ROLL, OP_2OVER, OP_DROP, OP_2DROP, OP_FROMALTSTACK, OP_TOALTSTACK, OP_NUMEQUAL, OP_NOT, OP_EQUAL};

// No operation opcode
pub const OP_NOP: Opcode = Opcode::Native("");

pub const OP_4PICK: Opcode = Opcode::Composed(&[
    OP_4, OP_ADD, 
    OP_DUP,  OP_PICK, OP_SWAP,
    OP_DUP,  OP_PICK, OP_SWAP,
    OP_DUP,  OP_PICK, OP_SWAP,
    OP_1SUB, OP_PICK
]);

pub const OP_4ROLL: Opcode = Opcode::Composed(&[
    OP_4, OP_ADD, 
    OP_DUP,  OP_ROLL, OP_SWAP,
    OP_DUP,  OP_ROLL, OP_SWAP,
    OP_DUP,  OP_ROLL, OP_SWAP,
    OP_1SUB, OP_ROLL
]);

pub const OP_4DUP: Opcode = Opcode::Composed(&[
    OP_2OVER, OP_2OVER
]);


pub const OP_4DROP: Opcode = Opcode::Composed(&[
    OP_DROP, OP_2DROP
]);

pub const OP_4SWAP : Opcode = Opcode::Composed(&[
    Opcode::Value(7), OP_ROLL, Opcode::Value(7), OP_ROLL,
    Opcode::Value(7), OP_ROLL, Opcode::Value(7), OP_ROLL
]);

pub const OP_4TOALTSTACK : Opcode = Opcode::Composed(&[
    OP_TOALTSTACK,
    OP_TOALTSTACK,
    OP_TOALTSTACK,
    OP_TOALTSTACK,
]);

pub const OP_4FROMALTSTACK : Opcode = Opcode::Composed(&[
    OP_FROMALTSTACK,
    OP_FROMALTSTACK,
    OP_FROMALTSTACK,
    OP_FROMALTSTACK,
]);

// 
// Multiplication by Powers of 2
// 

// The input is multiplied by 2
pub const OP_2MUL : Opcode = Opcode::Composed(&[OP_DUP, OP_ADD]);

// The input is multiplied by 4
pub const OP_4MUL : Opcode = Opcode::Composed(&[
    OP_DUP, OP_ADD, OP_DUP, OP_ADD
]);

// TODO: Should loop be a macro or a function?
// The input is multiplied by 2**k
// export const op_2k_mul = k => loop(k, _ => OP_2MUL)

// The input is multiplied by 16
pub const OP_16MUL : Opcode = Opcode::Composed(&[
    OP_DUP, OP_ADD, OP_DUP, OP_ADD, 
    OP_DUP, OP_ADD, OP_DUP, OP_ADD
]);

pub const OP_256MUL : Opcode = Opcode::Composed(&[
    OP_DUP, OP_ADD, OP_DUP, OP_ADD, 
    OP_DUP, OP_ADD, OP_DUP, OP_ADD,
    OP_DUP, OP_ADD, OP_DUP, OP_ADD, 
    OP_DUP, OP_ADD, OP_DUP, OP_ADD
]);

// Boolean XOR
// WARNING: Doesn't error for non-bit values
pub const OP_BOOLXOR : Opcode = OP_NUMEQUAL;
pub const OP_NOTEQUAL : Opcode = Opcode::Composed(&[OP_EQUAL, OP_NOT]);
pub const DEBUG : Opcode = Opcode::Native("debug;");

// TODO
//type OpcodeTemplate = dyn Fn(usize, usize) -> &'static [Opcode];
//fn unroll<F>(count: usize, template: F) -> &'static [Opcode]
//where
//    F: Fn(usize, usize) -> String,
//{
//    let mut res = &[]
//    for i in 0..count {
//        res.push(template(i, count));
//    }
//    res
//}

//const unroll :   = |count: usize, template: &dyn Fn(usize, usize) -> &[Opcode]| ->  {
//    let mut res = Vec::new();
//    for i in 0..count {
//        res.push(template(i, count));
//    }
//    res
//};

use super::{Opcode, OP_4, OP_ADD, OP_DUP, OP_PICK, OP_SWAP, OP_1SUB, OP_ROLL, OP_2OVER, OP_DROP, OP_2DROP};

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

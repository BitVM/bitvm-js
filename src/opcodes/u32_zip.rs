use super::ToOpcode;
use super::{Opcode, OP_ROLL};
use crate::compose;

pub fn u32_zip(a: i32, b: i32) -> Opcode<'static> {
    //if a > b {
    //    (a, b) = (b, a);
    //}

    let x = (a + 1) * 4 - 1;
    let y = (b + 1) * 4 - 1;
    compose!([1, 3 + 7, OP_ROLL])
    //return compose!([
    //    x + 0,
    //    OP_ROLL,
    //    y,
    //    OP_ROLL,
    //    x + 1,
    //    OP_ROLL,
    //    y,
    //    OP_ROLL,
    //    x + 2,
    //    OP_ROLL,
    //    y,
    //    OP_ROLL,
    //    x + 3,
    //    OP_ROLL,
    //    y,
    //    OP_ROLL
    //]);
}

//export const u32_copy_zip = (a, b) =>
//	a < b ? _u32_copy_zip(a, b) : _u32_zip_copy(b, a);
//
//const _u32_copy_zip = (a, b) => {
//    if (a >= b)
//        throw 'Error: a >= b'
//
//    a = (a + 1) * 4 - 1
//    b = (b + 1) * 4 - 1
//    return [
//        a+0, OP_PICK, b+1, OP_ROLL,
//        a+1, OP_PICK, b+2, OP_ROLL,
//        a+2, OP_PICK, b+3, OP_ROLL,
//        a+3, OP_PICK, b+4, OP_ROLL,
//    ]
//}
//
//const _u32_zip_copy = (a, b) => {
//    if (a >= b)
//        throw 'Error: a >= b'
//
//    a = (a + 1) * 4 - 1
//    b = (b + 1) * 4 - 1
//    return [
//        a+0, OP_ROLL, b, OP_PICK,
//        a+1, OP_ROLL, b, OP_PICK,
//        a+2, OP_ROLL, b, OP_PICK,
//        a+3, OP_ROLL, b, OP_PICK,
//    ]
//}
//

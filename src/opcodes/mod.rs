#![allow(dead_code)]
extern crate bitvm_proc_macro;


use std::fmt;

pub mod pseudo;
pub mod u32_zip;

pub enum Opcode<'a> {
    Native(&'a str),
    Value(i32),
    Composed(&'a [Opcode<'a>]),
}

pub trait ToOpcode<'a> {
    fn to_opcode(self) -> Opcode<'a>;
}

impl<'a> ToOpcode<'a> for i32 {
    fn to_opcode(self) -> Opcode<'a> {
        Opcode::Value(self)
    }
}

impl<'a> ToOpcode<'a> for u32 {
    fn to_opcode(self) -> Opcode<'a> {
        Opcode::Value(self as i32)
    }
}

impl<'a> ToOpcode<'a> for Opcode<'a> {
    fn to_opcode(self) -> Opcode<'a> {
        self
    }
}


impl<'a> fmt::Debug for Opcode<'a> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Opcode::Native(x) => write!(f, "{:?}", x),
            Opcode::Value(x) => write!(f, "{:?}", x),
            Opcode::Composed(x) => {
                let mut first = true;
                for op in x.iter() {
                    if !first {
                        write!(f, " ")?;
                    } else {
                        first = false;
                    }
                    write!(f, "{:?}", op)?;
                }
                Ok(())
            }
        }
    }
}


#[macro_export]
macro_rules! const_compose {
    ( [ $($x:expr),+ ] ) => (
        Opcode::Composed(&[ $ ( bitvm_proc_macro::make_opcode!($x) ) , * ] )
    )
}


#[macro_export]
macro_rules! compose {
    ( [ $($x:expr),+ ] ) => (
        Opcode::Composed(&[ 
            $ ( ($x).to_opcode()) , * 
        ])
    )
}


pub const OP_0: Opcode = Opcode::Native("OP_0");
pub const OP_PUSHDATA1: Opcode = Opcode::Native("OP_PUSHDATA1");
pub const OP_PUSHDATA2: Opcode = Opcode::Native("OP_PUSHDATA2");
pub const OP_PUSHDATA4: Opcode = Opcode::Native("OP_PUSHDATA4");
pub const OP_1NEGATE: Opcode = Opcode::Native("OP_1NEGATE");
pub const OP_RESERVED: Opcode = Opcode::Native("OP_RESERVED"); // OP_SUCCESS80
pub const OP_1: Opcode = Opcode::Native("OP_1");
pub const OP_2: Opcode = Opcode::Native("OP_2");
pub const OP_3: Opcode = Opcode::Native("OP_3");
pub const OP_4: Opcode = Opcode::Native("OP_4");
pub const OP_5: Opcode = Opcode::Native("OP_5");
pub const OP_6: Opcode = Opcode::Native("OP_6");
pub const OP_7: Opcode = Opcode::Native("OP_7");
pub const OP_8: Opcode = Opcode::Native("OP_8");
pub const OP_9: Opcode = Opcode::Native("OP_9");
pub const OP_10: Opcode = Opcode::Native("OP_10");
pub const OP_11: Opcode = Opcode::Native("OP_11");
pub const OP_12: Opcode = Opcode::Native("OP_12");
pub const OP_13: Opcode = Opcode::Native("OP_13");
pub const OP_14: Opcode = Opcode::Native("OP_14");
pub const OP_15: Opcode = Opcode::Native("OP_15");
pub const OP_16: Opcode = Opcode::Native("OP_16");
pub const OP_FALSE: Opcode = Opcode::Native("OP_0");
pub const OP_TRUE: Opcode = Opcode::Native("OP_1");
pub const OP_NOP: Opcode = Opcode::Native("OP_NOP");
pub const OP_VER: Opcode = Opcode::Native("OP_VER"); // OP_SUCCESS98
pub const OP_IF: Opcode = Opcode::Native("OP_IF");
pub const OP_NOTIF: Opcode = Opcode::Native("OP_NOTIF");
pub const OP_VERIF: Opcode = Opcode::Native("OP_VERIF");
pub const OP_VERNOTIF: Opcode = Opcode::Native("OP_VERNOTIF");
pub const OP_ELSE: Opcode = Opcode::Native("OP_ELSE");
pub const OP_ENDIF: Opcode = Opcode::Native("OP_ENDIF");
pub const OP_VERIFY: Opcode = Opcode::Native("OP_VERIFY");
pub const OP_RETURN: Opcode = Opcode::Native("OP_RETURN");
pub const OP_TOALTSTACK: Opcode = Opcode::Native("OP_TOALTSTACK");
pub const OP_FROMALTSTACK: Opcode = Opcode::Native("OP_FROMALTSTACK");
pub const OP_2DROP: Opcode = Opcode::Native("OP_2DROP");
pub const OP_2DUP: Opcode = Opcode::Native("OP_2DUP");
pub const OP_3DUP: Opcode = Opcode::Native("OP_3DUP");
pub const OP_2OVER: Opcode = Opcode::Native("OP_2OVER");
pub const OP_2ROT: Opcode = Opcode::Native("OP_2ROT");
pub const OP_2SWAP: Opcode = Opcode::Native("OP_2SWAP");
pub const OP_IFDUP: Opcode = Opcode::Native("OP_IFDUP");
pub const OP_DEPTH: Opcode = Opcode::Native("OP_DEPTH");
pub const OP_DROP: Opcode = Opcode::Native("OP_DROP");
pub const OP_DUP: Opcode = Opcode::Native("OP_DUP");
pub const OP_NIP: Opcode = Opcode::Native("OP_NIP");
pub const OP_OVER: Opcode = Opcode::Native("OP_OVER");
pub const OP_PICK: Opcode = Opcode::Native("OP_PICK");
pub const OP_ROLL: Opcode = Opcode::Native("OP_ROLL");
pub const OP_ROT: Opcode = Opcode::Native("OP_ROT");
pub const OP_SWAP: Opcode = Opcode::Native("OP_SWAP");
pub const OP_TUCK: Opcode = Opcode::Native("OP_TUCK");
pub const OP_SUCCESS126: Opcode = Opcode::Native("OP_SUCCESS126"); // OP_CAT
pub const OP_SUCCESS127: Opcode = Opcode::Native("OP_SUCCESS127"); // OP_SUBSTR
pub const OP_SUCCESS128: Opcode = Opcode::Native("OP_SUCCESS128"); // OP_LEFT
pub const OP_SUCCESS129: Opcode = Opcode::Native("OP_SUCCESS129"); // OP_RIGHT
pub const OP_SIZE: Opcode = Opcode::Native("OP_SIZE");
pub const OP_SUCCESS131: Opcode = Opcode::Native("OP_SUCCESS131"); // OP_INVERT
pub const OP_SUCCESS132: Opcode = Opcode::Native("OP_SUCCESS132"); // OP_AND
pub const OP_SUCCESS133: Opcode = Opcode::Native("OP_SUCCESS133"); // OP_OR
pub const OP_SUCCESS134: Opcode = Opcode::Native("OP_SUCCESS134"); // OP_XOR
pub const OP_EQUAL: Opcode = Opcode::Native("OP_EQUAL");
pub const OP_EQUALVERIFY: Opcode = Opcode::Native("OP_EQUALVERIFY");
pub const OP_SUCCESS137: Opcode = Opcode::Native("OP_SUCCESS137"); // OP_RESERVED1
pub const OP_SUCCESS138: Opcode = Opcode::Native("OP_SUCCESS138"); // OP_RESERVED2
pub const OP_1ADD: Opcode = Opcode::Native("OP_1ADD");
pub const OP_1SUB: Opcode = Opcode::Native("OP_1SUB");
pub const OP_SUCCESS141: Opcode = Opcode::Native("OP_SUCCESS141"); // OP_2MUL
pub const OP_SUCCESS142: Opcode = Opcode::Native("OP_SUCCESS142"); // OP_2DIV
pub const OP_NEGATE: Opcode = Opcode::Native("OP_NEGATE");
pub const OP_ABS: Opcode = Opcode::Native("OP_ABS");
pub const OP_NOT: Opcode = Opcode::Native("OP_NOT");
pub const OP_0NOTEQUAL: Opcode = Opcode::Native("OP_0NOTEQUAL");
pub const OP_ADD: Opcode = Opcode::Native("OP_ADD");
pub const OP_SUB: Opcode = Opcode::Native("OP_SUB");
pub const OP_SUCCESS149: Opcode = Opcode::Native("OP_SUCCESS149"); // OP_MUL
pub const OP_SUCCESS150: Opcode = Opcode::Native("OP_SUCCESS150"); // OP_DIV
pub const OP_SUCCESS151: Opcode = Opcode::Native("OP_SUCCESS151"); // OP_MOD
pub const OP_SUCCESS152: Opcode = Opcode::Native("OP_SUCCESS152"); // OP_LSHIFT
pub const OP_SUCCESS153: Opcode = Opcode::Native("OP_SUCCESS153"); // OP_RSHIFT
pub const OP_BOOLAND: Opcode = Opcode::Native("OP_BOOLAND");
pub const OP_BOOLOR: Opcode = Opcode::Native("OP_BOOLOR");
pub const OP_NUMEQUAL: Opcode = Opcode::Native("OP_NUMEQUAL");
pub const OP_NUMEQUALVERIFY: Opcode = Opcode::Native("OP_NUMEQUALVERIFY");
pub const OP_NUMNOTEQUAL: Opcode = Opcode::Native("OP_NUMNOTEQUAL");
pub const OP_LESSTHAN: Opcode = Opcode::Native("OP_LESSTHAN");
pub const OP_GREATERTHAN: Opcode = Opcode::Native("OP_GREATERTHAN");
pub const OP_LESSTHANOREQUAL: Opcode = Opcode::Native("OP_LESSTHANOREQUAL");
pub const OP_GREATERTHANOREQUAL: Opcode = Opcode::Native("OP_GREATERTHANOREQUAL");
pub const OP_MIN: Opcode = Opcode::Native("OP_MIN");
pub const OP_MAX: Opcode = Opcode::Native("OP_MAX");
pub const OP_WITHIN: Opcode = Opcode::Native("OP_WITHIN");
pub const OP_RIPEMD160: Opcode = Opcode::Native("OP_RIPEMD160");
pub const OP_SHA1: Opcode = Opcode::Native("OP_SHA1");
pub const OP_SHA256: Opcode = Opcode::Native("OP_SHA256");
pub const OP_HASH160: Opcode = Opcode::Native("OP_HASH160");
pub const OP_HASH256: Opcode = Opcode::Native("OP_HASH256");
pub const OP_CODESEPARATOR: Opcode = Opcode::Native("OP_CODESEPARATOR");
// TODO: WARNING
pub const OP_CHECKSIG: Opcode = Opcode::Composed(&[OP_2DROP, OP_TRUE]); // "OP_CHECKSIG"
pub const OP_CHECKSIGVERIFY: Opcode = Opcode::Composed(&[OP_2DROP]); // "OP_CHECKSIGVERIFY"
pub const OP_CHECKMULTISIG: Opcode = Opcode::Native("OP_CHECKMULTISIG");
pub const OP_CHECKMULTISIGVERIFY: Opcode = Opcode::Native("OP_CHECKMULTISIGVERIFY");
pub const OP_NOP1: Opcode = Opcode::Native("OP_NOP1");
pub const OP_CHECKLOCKTIMEVERIFY: Opcode = Opcode::Native("OP_CHECKLOCKTIMEVERIFY");
// TODO: WARNING
pub const OP_CHECKSEQUENCEVERIFY: [Opcode; 2] = [OP_TRUE, OP_VERIFY];
pub const OP_NOP4: Opcode = Opcode::Native("OP_NOP4");
pub const OP_NOP5: Opcode = Opcode::Native("OP_NOP5");
pub const OP_NOP6: Opcode = Opcode::Native("OP_NOP6");
pub const OP_NOP7: Opcode = Opcode::Native("OP_NOP7");
pub const OP_NOP8: Opcode = Opcode::Native("OP_NOP8");
pub const OP_NOP9: Opcode = Opcode::Native("OP_NOP9");
pub const OP_NOP10: Opcode = Opcode::Native("OP_NOP10");
pub const OP_CHECKSIGADD: Opcode = Opcode::Native("OP_CHECKSIGADD");
pub const OP_SUCCESS187: Opcode = Opcode::Native("OP_SUCCESS187");
pub const OP_SUCCESS188: Opcode = Opcode::Native("OP_SUCCESS188");
pub const OP_SUCCESS189: Opcode = Opcode::Native("OP_SUCCESS189");
pub const OP_SUCCESS190: Opcode = Opcode::Native("OP_SUCCESS190");
pub const OP_SUCCESS191: Opcode = Opcode::Native("OP_SUCCESS191");
pub const OP_SUCCESS192: Opcode = Opcode::Native("OP_SUCCESS192");
pub const OP_SUCCESS193: Opcode = Opcode::Native("OP_SUCCESS193");
pub const OP_SUCCESS194: Opcode = Opcode::Native("OP_SUCCESS194");
pub const OP_SUCCESS195: Opcode = Opcode::Native("OP_SUCCESS195");
pub const OP_SUCCESS196: Opcode = Opcode::Native("OP_SUCCESS196");
pub const OP_SUCCESS197: Opcode = Opcode::Native("OP_SUCCESS197");
pub const OP_SUCCESS198: Opcode = Opcode::Native("OP_SUCCESS198");
pub const OP_SUCCESS199: Opcode = Opcode::Native("OP_SUCCESS199");
pub const OP_SUCCESS200: Opcode = Opcode::Native("OP_SUCCESS200");
pub const OP_SUCCESS201: Opcode = Opcode::Native("OP_SUCCESS201");
pub const OP_SUCCESS202: Opcode = Opcode::Native("OP_SUCCESS202");
pub const OP_SUCCESS203: Opcode = Opcode::Native("OP_SUCCESS203");
pub const OP_SUCCESS204: Opcode = Opcode::Native("OP_SUCCESS204");
pub const OP_SUCCESS205: Opcode = Opcode::Native("OP_SUCCESS205");
pub const OP_SUCCESS206: Opcode = Opcode::Native("OP_SUCCESS206");
pub const OP_SUCCESS207: Opcode = Opcode::Native("OP_SUCCESS207");
pub const OP_SUCCESS208: Opcode = Opcode::Native("OP_SUCCESS208");
pub const OP_SUCCESS209: Opcode = Opcode::Native("OP_SUCCESS209");
pub const OP_SUCCESS210: Opcode = Opcode::Native("OP_SUCCESS210");
pub const OP_SUCCESS211: Opcode = Opcode::Native("OP_SUCCESS211");
pub const OP_SUCCESS212: Opcode = Opcode::Native("OP_SUCCESS212");
pub const OP_SUCCESS213: Opcode = Opcode::Native("OP_SUCCESS213");
pub const OP_SUCCESS214: Opcode = Opcode::Native("OP_SUCCESS214");
pub const OP_SUCCESS215: Opcode = Opcode::Native("OP_SUCCESS215");
pub const OP_SUCCESS216: Opcode = Opcode::Native("OP_SUCCESS216");
pub const OP_SUCCESS217: Opcode = Opcode::Native("OP_SUCCESS217");
pub const OP_SUCCESS218: Opcode = Opcode::Native("OP_SUCCESS218");
pub const OP_SUCCESS219: Opcode = Opcode::Native("OP_SUCCESS219");
pub const OP_SUCCESS220: Opcode = Opcode::Native("OP_SUCCESS220");
pub const OP_SUCCESS221: Opcode = Opcode::Native("OP_SUCCESS221");
pub const OP_SUCCESS222: Opcode = Opcode::Native("OP_SUCCESS222");
pub const OP_SUCCESS223: Opcode = Opcode::Native("OP_SUCCESS223");
pub const OP_SUCCESS224: Opcode = Opcode::Native("OP_SUCCESS224");
pub const OP_SUCCESS225: Opcode = Opcode::Native("OP_SUCCESS225");
pub const OP_SUCCESS226: Opcode = Opcode::Native("OP_SUCCESS226");
pub const OP_SUCCESS227: Opcode = Opcode::Native("OP_SUCCESS227");
pub const OP_SUCCESS228: Opcode = Opcode::Native("OP_SUCCESS228");
pub const OP_SUCCESS229: Opcode = Opcode::Native("OP_SUCCESS229");
pub const OP_SUCCESS230: Opcode = Opcode::Native("OP_SUCCESS230");
pub const OP_SUCCESS231: Opcode = Opcode::Native("OP_SUCCESS231");
pub const OP_SUCCESS232: Opcode = Opcode::Native("OP_SUCCESS232");
pub const OP_SUCCESS233: Opcode = Opcode::Native("OP_SUCCESS233");
pub const OP_SUCCESS234: Opcode = Opcode::Native("OP_SUCCESS234");
pub const OP_SUCCESS235: Opcode = Opcode::Native("OP_SUCCESS235");
pub const OP_SUCCESS236: Opcode = Opcode::Native("OP_SUCCESS236");
pub const OP_SUCCESS237: Opcode = Opcode::Native("OP_SUCCESS237");
pub const OP_SUCCESS238: Opcode = Opcode::Native("OP_SUCCESS238");
pub const OP_SUCCESS239: Opcode = Opcode::Native("OP_SUCCESS239");
pub const OP_SUCCESS240: Opcode = Opcode::Native("OP_SUCCESS240");
pub const OP_SUCCESS241: Opcode = Opcode::Native("OP_SUCCESS241");
pub const OP_SUCCESS242: Opcode = Opcode::Native("OP_SUCCESS242");
pub const OP_SUCCESS243: Opcode = Opcode::Native("OP_SUCCESS243");
pub const OP_SUCCESS244: Opcode = Opcode::Native("OP_SUCCESS244");
pub const OP_SUCCESS245: Opcode = Opcode::Native("OP_SUCCESS245");
pub const OP_SUCCESS246: Opcode = Opcode::Native("OP_SUCCESS246");
pub const OP_SUCCESS247: Opcode = Opcode::Native("OP_SUCCESS247");
pub const OP_SUCCESS248: Opcode = Opcode::Native("OP_SUCCESS248");
pub const OP_SUCCESS249: Opcode = Opcode::Native("OP_SUCCESS249");
pub const OP_SUCCESS250: Opcode = Opcode::Native("OP_SUCCESS250");
pub const OP_SUCCESS251: Opcode = Opcode::Native("OP_SUCCESS251");
pub const OP_SUCCESS252: Opcode = Opcode::Native("OP_SUCCESS252");
pub const OP_SUCCESS253: Opcode = Opcode::Native("OP_SUCCESS253");
pub const OP_SUCCESS254: Opcode = Opcode::Native("OP_SUCCESS254");
pub const OP_INVALIDOPCODE: Opcode = Opcode::Native("OP_INVALIDOPCODE");

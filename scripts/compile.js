import './opcodes/opcodes.js'
import './opcodes/std.js'
import { ripemd160 } from '../libs/ripemd160.js'
import { fromHex, toHex } from '../libs/bytes.js'
import { pushText, pushHex, pushHexEndian, sanitizeBytes } from './utils.js'
import { u32_push, u32_equalverify, u32_equal, u32_notequal, u32_toaltstack, u32_fromaltstack, u32_drop, u32_roll, u32_pick} from './opcodes/u32_std.js'
import { u32_lessthan, u32_greaterthan, u32_lessthanorequal, u32_greaterthanorequal } from './opcodes/u32_cmp.js'
import { u32_rrot7, u32_rrot8, u32_rrot12, u32_rrot16 } from './opcodes/u32_rrot.js'
import { u32_zip, u32_copy_zip } from './opcodes/u32_zip.js'
import { u32_add, u32_add_drop } from './opcodes/u32_add.js'
import { u32_sub, u32_sub_drop } from './opcodes/u32_sub.js'
import { u32_xor, u32_push_xor_table, u32_drop_xor_table } from './opcodes/u32_xor.js'
import { u32_or } from './opcodes/u32_or.js'
import { u32_and } from './opcodes/u32_and.js'
import { bit_state_unlock, u8_state, u8_state_unlock, u32_state, u32_state_unlock, u2_state_commit, u8_state_commit, u32_state_commit, u2_state, u2_state_unlock, u2_state_justice } from './opcodes/u32_state.js'
import { u160_state, u160_state_unlock, u160_state_commit, u160_equalverify, u160_equal, u160_notequal, u160_push } from './opcodes/u160_std.js'
import { u256_equalverify } from './opcodes/u256_std.js'
import { blake3, blake3_160 } from './opcodes/blake3.js'
import { Player } from './player.js';
import { Script } from '../libs/tapscript.js'
import init, { script_asm_to_hex } from '../libs/bitcoin_scriptexec.js'
await init()


function optimize(code) {
    for (let i = 1; i < code.length; ++ i) {
        if (code[i] === OP_ADD) {
            if (code[i-1] === 1 || code[i-1] === OP_1) {
                code.splice(i-1, 2, OP_1ADD)
            }
            if (code[i-1] === 0 || code[i-1] === OP_0) {
                code.splice(i-1, 2)
            }
        }
        if (code[i] === OP_SUB) {
            if (code[i-1] === 1 || code[i-1] === OP_1) {
                code.splice(i-1, 2, OP_1SUB)
            }
            if (code[i-1] === 0 || code[i-1] === OP_0) {
                code.splice(i-1, 2)
            }
        }
        if (code[i] === OP_DROP && code[i-1] === OP_DROP) {
            code.splice(i-1, 2, OP_2DROP)
        }
        if (code[i] == OP_ROLL) {
            if (code[i-1] === 0 || code[i-1] === OP_0) {
                code.splice(i-1, 2)
            }
            if (code[i-1] === 1 || code[i-1] === OP_1) {
                code.splice(i-1, 2, OP_SWAP)
            }
            if (code[i-1] === 2 || code[i-1] === OP_2) {
                code.splice(i-1, 2, OP_ROT)
            }
        }
        if (code[i] == OP_PICK) {
            if (code[i-1] === 0 || code[i-1] === OP_0) {
                code.splice(i-1, 2, OP_DUP)
            }
            if (code[i-1] === 1 || code[i-1] === OP_1) {
                code.splice(i-1, 2, OP_OVER)
            }
        }
        if (code[i] === OP_FROMALTSTACK && code[i-1] === OP_TOALTSTACK) {
            code.splice(i-1, 2)
        }
        
        // const int = parseInt(code[i], 10);
        // if(!isNaN(int)){
        //     code[i] = encodeScriptNumLE(int)
        // }
    }
    return code
}

export function preprocessJS(source) {
    let code = eval(source)
    if (Array.isArray(code)) {
        code = optimize(code.flat(Infinity)).join(' ')
    }
    code = code.split('debug;')[0]
    return code
}


function encodeScriptNumLE(n) {
   // Minimal opcodes for small ints
  if (n === 0) return 'OP_0';
  if (n === -1) return 'OP_1NEGATE'; // or: return '81' if you want data push
  if (1 <= n && n <= 16) return 'OP_' + n;
  
  const neg = n < 0;
  let v = Math.abs(n);
  const bytes = [];
  while (v > 0) { bytes.push(v & 0xff); v >>= 8; }
  if (bytes.length === 0) bytes.push(0x00); // zero

  const msbIndex = bytes.length - 1;
  if (neg) {
    if (bytes[msbIndex] & 0x80) {
      bytes.push(0x80);           // extend and set sign bit
    } else {
      bytes[msbIndex] |= 0x80;    // set sign bit
    }
  } else {
    if (bytes[msbIndex] & 0x80) {
      bytes.push(0x00);           // avoid being interpreted as negative
    }
  }
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function compileScript(program) {
  return preprocessJS(program)
    .split(' ')
    .filter(x => x.trim().length > 0)
    .map(x => {
      if (x.length > 8) return x;          // keep long hex/hash tokens
      const int = parseInt(x, 10);
      if (isNaN(int)) return x;            // non-integers unchanged

      // Minimal opcodes for small ints
      if (int === 0) return 'OP_0';
      if (int === -1) return 'OP_1NEGATE'; // or: return '81' if you want data push
      if (1 <= int && int <= 16) return 'OP_' + int;

      // Minimal sign-and-magnitude little-endian encoding
      return encodeScriptNumLE(int);
    });
}




export function replace_unlock_opcodes(script) {
    return script.map(opcode => {
        switch (opcode) {
            case OP_0:
                return '00'
            case OP_1:
                return '01'
            case OP_2:
                return '02'
            case OP_3:
                return '03'
            case OP_4:
                return '04'
            case OP_5:
                return '05'
            case OP_6:
                return '06'
            case OP_7:
                return '07'
            case OP_8:
                return '08'
            case OP_9:
                return '09'
            case OP_10:
                return '0a'
            case OP_11:
                return '0b'
            case OP_12:
                return '0c'
            case OP_13:
                return '0d'
            case OP_14:
                return '0e'
            case OP_15:
                return '0f'
            case OP_16:
                return '10'
            default:
                return opcode
        }
    })
}

export function compileUnlockScript(program) {
    return replace_unlock_opcodes(compileScript(program))
}

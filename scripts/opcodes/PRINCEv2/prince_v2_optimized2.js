/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                             *
 *          PRINCE‑v2  (10.13 kB script size)                  *
 *                                                             *
 *                              by 1ˣ Group  – March 2026      *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Helper function to split a 64-bit number into 16 nibbles
function split_into_nibbles(x) {
    return [...Array(16)].map((_, i) => Number((x >> BigInt(4 * (15 - i))) & 0xfn)).reverse()
}

window.STATS = {}
const stats = (name) => {
    if (!window.STATS[name]) { window.STATS[name] = 1; return; }
    window.STATS[name]++
}

/*───────────────────────────────────────────────────────────────
 * 0 ·  Constants
 */


const NUM_OF_ROUNDS = 12
const RC = [0x0000000000000000n, 0x13198a2e03707344n, 0xa4093822299f31d0n, 0x082efa98ec4e6c89n, 0x452821e638d01377n, 0xbe5466cf34e90c6cn, 0x7ef84f78fd955cb1n, 0x7aacf4538d971a60n, 0xc882d32f25323c54n, 0x9b8ded979cd838c7n, 0xd3b5a399ca0c2399n, 0x3f84d5b5b5470917n].map(split_into_nibbles)
const BETA = split_into_nibbles(0x3f84d5b5b5470917n)
const PRINCE_SHIFT = [0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11]
const PRINCE_SHIFT_INVERSE = [0, 13, 10, 7, 4, 1, 14, 11, 8, 5, 2, 15, 12, 9, 6, 3]
const PRINCE_SBOX = [0xb, 0xf, 0x3, 0x2, 0xa, 0xc, 0x9, 0x1, 0x6, 0x7, 0x8, 0x0, 0xe, 0x5, 0xd, 0x4]
const PRINCE_SBOX_INVERSE = [0xb, 0x7, 0x3, 0x2, 0xf, 0xd, 0x8, 0x9, 0xa, 0x6, 0x4, 0x0, 0x5, 0xe, 0xc, 0x1]
const M = [0x7, 0xb, 0xd, 0xe]

const SIZE_STATE = 16
const SIZE_KEY = 32
const SIZE_SHIFT_TABLE = 16
const SIZE_SBOX_TABLE = 16
const SIZE_SBOX_INV_TABLE = 16
const SIZE_XOR_TABLE = 256
const SIZE_AND_TABLE = 16
const SIZE_MEMORY = SIZE_STATE + SIZE_KEY + SIZE_SHIFT_TABLE + SIZE_SBOX_TABLE + SIZE_SBOX_INV_TABLE + SIZE_XOR_TABLE + SIZE_AND_TABLE * 8

/*───────────────────────────────────────────────────────────────
 * 1 ·  Memory Topology Repacking 
 * Inverting Push Orders directly anchors hot lookups structurally beneath 128 bounds
 */
const ADDR_STATE = 0
const ADDR_KEY = 16

const ADDR_AND_M0_SHIFT_TABLE = 48
const ADDR_AND_M1_SHIFT_TABLE = 64
const ADDR_AND_M2_SHIFT_TABLE = 80
const ADDR_AND_M3_SHIFT_TABLE = 96
const ADDR_SBOX_TABLE = 112
const ADDR_SBOX_INV_TABLE = 128
const ADDR_AND_M0_TABLE = 144
const ADDR_AND_M1_TABLE = 160
const ADDR_AND_M2_TABLE = 176
const ADDR_AND_M3_TABLE = 192
const ADDR_SHIFT_TABLE = 208
const ADDR_XOR_TABLE = 224

const push_xor_table = loop(16, i => loop(16, j => (15 - i) ^ (15 - j)))
const push_shift_table = loop(SIZE_SHIFT_TABLE, i => i * 16 + ADDR_XOR_TABLE - 1).reverse()

const push_and_table_m0 = loop(16, i => M[0] & i).reverse()
const push_and_table_m1 = loop(16, i => M[1] & i).reverse()
const push_and_table_m2 = loop(16, i => M[2] & i).reverse()
const push_and_table_m3 = loop(16, i => M[3] & i).reverse()

const push_and_shift_table_m0 = loop(16, i => (M[0] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m1 = loop(16, i => (M[1] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m2 = loop(16, i => (M[2] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m3 = loop(16, i => (M[3] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()

const push_sbox_table = PRINCE_SBOX.slice().reverse()
const push_sbox_inv_table = PRINCE_SBOX_INVERSE.slice().reverse()

const push_tables = _ => [
    push_xor_table,
    push_shift_table,
    push_and_table_m3,
    push_and_table_m2,
    push_and_table_m1,
    push_and_table_m0,
    push_sbox_inv_table,
    push_sbox_table,
    push_and_shift_table_m3,
    push_and_shift_table_m2,
    push_and_shift_table_m1,
    push_and_shift_table_m0,
]

// Clears entire map arrays elegantly 
const drop_tables = loop(Math.floor((SIZE_MEMORY - SIZE_STATE) / 2), _ => OP_2DROP)

const op_shift4 = (scratch = 0) => [ scratch + ADDR_SHIFT_TABLE, OP_ADD, OP_PICK ]

const op_xor_shifted = (scratch = 0) => {
    if (scratch === 0) return [OP_ADD, OP_PICK];
    if (scratch === 1) return [OP_ADD, OP_1ADD, OP_PICK];
    if (scratch === -1) return [OP_ADD, OP_1SUB, OP_PICK];
    return [OP_ADD, (scratch > 0) ? [scratch, OP_ADD] : [-scratch, OP_SUB], OP_PICK];
}

const op_xor_constant = (constant, scratch = 0) => {
    if (constant === 0) return []
    if (constant === 0x0f) return [ 0x0f, OP_SWAP, OP_SUB ] // Perfect native bounds simplification mapping
    return [ constant * 16 + scratch + ADDR_XOR_TABLE - 1, OP_ADD, OP_PICK ]
}

const op_and_m = (m, scratch = 0) => {
    let base = [ADDR_AND_M0_TABLE, ADDR_AND_M1_TABLE, ADDR_AND_M2_TABLE, ADDR_AND_M3_TABLE][m];
    return [scratch + base - 1, OP_ADD, OP_PICK]
}

const op_and_m_shift = (m, scratch = 0) => {
    let base = [ADDR_AND_M0_SHIFT_TABLE, ADDR_AND_M1_SHIFT_TABLE, ADDR_AND_M2_SHIFT_TABLE, ADDR_AND_M3_SHIFT_TABLE][m];
    return [scratch + base - 1, OP_ADD, OP_PICK]
}

const op_sbox = (scratch = 0) => [scratch + ADDR_SBOX_TABLE - 1, OP_ADD, OP_PICK]
const op_sbox_inv = (scratch = 0) => [scratch + ADDR_SBOX_INV_TABLE - 1, OP_ADD, OP_PICK]

/*───────────────────────────────────────────────────────────────
 * 2 · Pointer bookkeeping 
 */
let ENV = {}
const STATE = i => `state_${i}`

const init_pointers = () => {
    for (let i = 0; i < SIZE_STATE; i++) ENV[STATE(i)] = i
}

const ptr_extract = identifier => {
    if (!(identifier in ENV)) throw `Undefined variable ${identifier}`
    const index = ENV[identifier]
    delete ENV[identifier]
    Object.keys(ENV).forEach(key => { if (index < ENV[key]) ENV[key] -= 1 })
    return index
}

const ptr_insert = identifier => {
    Object.keys(ENV).forEach(key => ENV[key] += 1)
    ENV[identifier] = 0
}

const op_move_state_to_top = (index, scratch = 0) => {
    const pos = ptr_extract(STATE(index)) + scratch;
    ptr_insert(STATE(index));
    if (pos === 0) return [];
    if (pos === 1) return [OP_SWAP];
    if (pos === 2) return [OP_ROT];
    return [pos, OP_ROLL];
}

const KEY = loop(SIZE_KEY, i => SIZE_KEY - 1 - i + ADDR_KEY)

const op_copy_key_to_top = (index, scratch = 0) => {
    const pos = KEY[index] + scratch;
    if (pos === 0) return [OP_DUP];
    if (pos === 1) return [OP_OVER];
    return [pos, OP_PICK];
}

/*───────────────────────────────────────────────────────────────
 * 3 · Engine Execution Pipeline 
 */

const prince_MHatMultiply = (base, useMHat0, pre_action = null, scratch = 0) => {
    const rot = useMHat0 ? 0 : 1;
    const C_idx = (r, j) => (r + j + rot) & 3;
    const A = [base, base + 1, base + 2, base + 3];

    return [
        op_move_state_to_top(15 - A[3]), pre_action ? pre_action(15 - A[3]) : [],
        op_move_state_to_top(15 - A[2]), pre_action ? pre_action(15 - A[2]) : [],
        op_move_state_to_top(15 - A[1]), pre_action ? pre_action(15 - A[1]) : [],
        op_move_state_to_top(15 - A[0]), pre_action ? pre_action(15 - A[0]) : [],

        OP_2OVER, OP_2OVER, OP_2OVER, OP_2OVER, OP_2OVER, OP_2OVER,

        loop(4, r => [
            op_and_m(C_idx(r, 0), scratch + 4 * (3 - r) - 0),   
            OP_SWAP, op_and_m_shift(C_idx(r, 1), scratch + 4 * (3 - r) - 0), op_xor_shifted(scratch + 4 * (3 - r) - 1),                
            OP_SWAP, op_and_m_shift(C_idx(r, 2), scratch + 4 * (3 - r) - 1), op_xor_shifted(scratch + 4 * (3 - r) - 2),
            OP_SWAP, op_and_m_shift(C_idx(r, 3), scratch + 4 * (3 - r) - 2), op_xor_shifted(scratch + 4 * (3 - r) - 3),                  
            OP_TOALTSTACK,
        ]),
        loop(4, i => OP_FROMALTSTACK),
    ]
}

const prince_m_layer = (pre_action = null) => {
    const rows = [
        { base: 0, useMHat0: true }, { base: 4, useMHat0: false },
        { base: 8, useMHat0: false }, { base: 12, useMHat0: true }
    ];
    
    // Natively evaluates shallowest active variable arrays intrinsically bypassing OP_ROLL operations!
    rows.sort((a, b) => {
        const depthA = ENV[STATE(15 - a.base)] + ENV[STATE(15 - (a.base+1))] + ENV[STATE(15 - (a.base+2))] + ENV[STATE(15 - (a.base+3))];
        const depthB = ENV[STATE(15 - b.base)] + ENV[STATE(15 - (b.base+1))] + ENV[STATE(15 - (b.base+2))] + ENV[STATE(15 - (b.base+3))];
        return depthA - depthB;
    });

    return rows.map(r => prince_MHatMultiply(r.base, r.useMHat0, pre_action));
};

const prince_shiftRow = inv => {
    const src = {}
    for (let i = 0; i < SIZE_STATE; i++) src[STATE(i)] = ENV[STATE(i)]
    if (inv) PRINCE_SHIFT_INVERSE.forEach((s, d) => ENV[STATE(15 - d)] = src[STATE(15 - s)])
    else PRINCE_SHIFT.forEach((s, d) => ENV[STATE(15 - d)] = src[STATE(15 - s)])
}

const op_load_key = () => loop(SIZE_KEY, i => [OP_FROMALTSTACK, op_shift4(i - SIZE_STATE - SIZE_KEY)])
const op_load_msg = () => loop(SIZE_STATE, i => OP_FROMALTSTACK)

const init_memory = [
     loop(SIZE_KEY + SIZE_STATE, i => OP_TOALTSTACK),
     push_tables(),
     op_load_key(), op_load_msg(),    
     init_pointers(),
]

const princev2_encrypt = [

    init_memory,
    
    // Pipelined: Initial Whitening merged flawlessly sequentially into Forward Round 1 M-Layer extraction
    prince_m_layer(idx => [
        op_copy_key_to_top(idx), 
        op_xor_shifted(),
        op_sbox()
    ]),
    prince_shiftRow(false),

    // Phase-Shift Loop Fusing directly maps SBox computations completely ignoring explicit extraction iterators completely!
    loop(4, i => {
        const r = i + 2;
        return [
            prince_m_layer(idx => [
                op_copy_key_to_top(((r - 1) % 2 ? idx + 16 : idx)),
                op_xor_shifted(),
                op_xor_constant(RC[r - 1][idx]),
                op_sbox()
            ]),
            prince_shiftRow(false)
        ]
    }),

    prince_m_layer(idx => [
        op_copy_key_to_top(5 % 2 ? idx + 16 : idx), 
        op_xor_shifted(),
        op_xor_constant(RC[5][idx]),
        op_sbox(),
        op_copy_key_to_top(idx), 
        op_xor_shifted()
    ]),

    prince_shiftRow(true),

    prince_m_layer(idx_after => {
        const idx_before = 15 - PRINCE_SHIFT_INVERSE[15 - idx_after];
        return [
            op_copy_key_to_top(idx_before + 16),
            op_xor_shifted(),
            op_xor_constant(BETA[idx_before]),
            op_sbox_inv(),
            op_copy_key_to_top(6 % 2 ? idx_before + 16 : idx_before), 
            op_xor_shifted(),
            op_xor_constant(RC[6][idx_before])
        ];
    }),

    loop(4, i => {
        const r = i + 7;
        return [
            prince_shiftRow(true),
            prince_m_layer(idx_after => {
                const idx_before = 15 - PRINCE_SHIFT_INVERSE[15 - idx_after];
                return [
                    op_sbox_inv(),
                    op_copy_key_to_top(r % 2 ? idx_before + 16 : idx_before),
                    op_xor_shifted(),
                    op_xor_constant(RC[r][idx_before])
                ];
            })
        ];
    }),

    // Pipelined trailing block maps explicitly handling final array output constraints!
    loop(SIZE_STATE, i => {
        const idx = SIZE_STATE - 1 - i;
        return [
            op_move_state_to_top(idx),
            op_sbox_inv(0),
            op_copy_key_to_top(idx + SIZE_STATE),
            op_xor_shifted(0),            
            op_xor_constant(BETA[idx], 0)
        ]
    }),

    loop(SIZE_STATE, _ => OP_TOALTSTACK),
    drop_tables,
    loop(SIZE_STATE, _ => OP_FROMALTSTACK),
 
];

// Test cases
const test_case_1 = _ => {
    const push_dummy_key = loop(SIZE_KEY, i  => 0)
    const push_dummy_msg = loop(SIZE_STATE, i => 0);

    return [
        push_dummy_key,
        push_dummy_msg,
        princev2_encrypt,
        console.table(window.STATS)
    ];
}


const test_case_2 = _ => {
    const KEY1 = split_into_nibbles(0x0123456789abcdefn);
    const KEY0 = split_into_nibbles(0xfedcba9876543210n);
    const PLAINTEXT = split_into_nibbles(0x0123456789abcdefn);
    const CYPHERTEXT = split_into_nibbles(0x603cd95fa72a8704n);

    return [
        [KEY0.reverse(), KEY1.reverse()],
        PLAINTEXT.reverse(),
        princev2_encrypt,
        console.table(window.STATS)
    ];
}

// Run test
/* >>> DON'T REMOVE THIS COMMENT! <<< */
test_case_2()

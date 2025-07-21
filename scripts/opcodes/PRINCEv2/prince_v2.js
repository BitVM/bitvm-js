/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                             *
 *          PRINCE‑v2  (nibble implementation)                 *
 *                                                             *
 *                              by 1ˣ Group  – July 2025       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */





// Helper function to split a 64-bit number into 16 nibbles
function split_into_nibbles(x) {
    return [...Array(16)].map((_, i) => Number((x >> BigInt(4 * (15 - i))) & 0xfn)).reverse()
}

// Helper function to track the number of times a function is called
window.STATS = {}
const stats = (name) => {
    if (!window.STATS[name]) {
        window.STATS[name] = 1
        return;
    }
    window.STATS[name]++
}


/*───────────────────────────────────────────────────────────────
 * 0 ·  Constants
 */


// Round constants
const RC = [
    0x0000000000000000n, 0x13198a2e03707344n, 0xa4093822299f31d0n,
    0x082efa98ec4e6c89n, 0x452821e638d01377n, 0xbe5466cf34e90c6cn,
    0x7ef84f78fd955cb1n, 0x7aacf4538d971a60n, 0xc882d32f25323c54n,
    0x9b8ded979cd838c7n, 0xd3b5a399ca0c2399n, 0x3f84d5b5b5470917n
].map( split_into_nibbles )

const ALPHA = split_into_nibbles(0xc0ac29b7c97c50ddn)
const BETA = split_into_nibbles(0x3f84d5b5b5470917n)

const NUM_OF_ROUNDS = 12

const PRINCE_SHIFT = [
    0, 5, 10, 15,
    4, 9, 14, 3,
    8, 13, 2, 7,
    12, 1, 6, 11
]

const PRINCE_SHIFT_INVERSE = [
    0, 13, 10, 7,
    4, 1, 14, 11,
    8, 5, 2, 15,
    12, 9, 6, 3
]

const PRINCE_SBOX = [
    0xb, 0xf, 0x3, 0x2,
    0xa, 0xc, 0x9, 0x1,
    0x6, 0x7, 0x8, 0x0,
    0xe, 0x5, 0xd, 0x4
]

const PRINCE_SBOX_INVERSE = [
    0xb, 0x7, 0x3, 0x2,
    0xf, 0xd, 0x8, 0x9,
    0xa, 0x6, 0x4, 0x0,
    0x5, 0xe, 0xc, 0x1
]

const M = [0x7, 0xb, 0xd, 0xe] // m0 m1 m2 m3

/*───────────────────────────────────────────────────────────────
 * 1 ·  Memory layout
 *
 *  Memory layout:
 *    <state                (16 bytes)> (s0, s1, ..., s15)
 *    <key                  (32 bytes)> (k0_0, ..., k0_15, k1_0, ..., k1_15)
 *    <shift_table          (16 bytes)>
 *    <sbox_table           (16 bytes)>
 *    <sbox_inv_table       (16 bytes)>
 *    <xor_table            (256 bytes)>    
 *    <and_m0_table         (16 bytes)>
 *    <and_m1_table         (16 bytes)>
 *    <and_m2_table         (16 bytes)>
 *    <and_m3_table         (16 bytes)>
 *    <and_m0_shift_table   (16 bytes)>
 *    <and_m1_shift_table   (16 bytes)>
 *    <and_m2_shift_table   (16 bytes)> 
 *    <and_m3_shift_table   (16 bytes)> 
 * 
 */


// Table Sizes
const SIZE_STATE = 16
const SIZE_KEY = 32
const SIZE_SHIFT_TABLE = 16
const SIZE_SBOX_TABLE = 16
const SIZE_SBOX_INV_TABLE = 16
const SIZE_XOR_TABLE = 256
const SIZE_AND_TABLE = 16

// Addresses
const ADDR_STATE = 0
const ADDR_KEY = ADDR_STATE + SIZE_STATE
const ADDR_SHIFT_TABLE = ADDR_KEY + SIZE_KEY
const ADDR_SBOX_TABLE = ADDR_SHIFT_TABLE + SIZE_SHIFT_TABLE
const ADDR_SBOX_INV_TABLE = ADDR_SBOX_TABLE + SIZE_SBOX_TABLE
const ADDR_XOR_TABLE = ADDR_SBOX_INV_TABLE + SIZE_SBOX_INV_TABLE
const ADDR_AND_M0_TABLE = ADDR_XOR_TABLE + SIZE_XOR_TABLE
const ADDR_AND_M1_TABLE = ADDR_AND_M0_TABLE + SIZE_AND_TABLE
const ADDR_AND_M2_TABLE = ADDR_AND_M1_TABLE + SIZE_AND_TABLE
const ADDR_AND_M3_TABLE = ADDR_AND_M2_TABLE + SIZE_AND_TABLE
const ADDR_AND_M0_SHIFT_TABLE = ADDR_AND_M3_TABLE + SIZE_AND_TABLE
const ADDR_AND_M1_SHIFT_TABLE = ADDR_AND_M0_SHIFT_TABLE + SIZE_AND_TABLE
const ADDR_AND_M2_SHIFT_TABLE = ADDR_AND_M1_SHIFT_TABLE + SIZE_AND_TABLE
const ADDR_AND_M3_SHIFT_TABLE = ADDR_AND_M2_SHIFT_TABLE + SIZE_AND_TABLE

// XOR table
const push_xor_table = loop(16, i => loop(16, j => (15 - i) ^ (15 - j)))

const push_shift_table = loop(SIZE_SHIFT_TABLE, i => (15 - i) * 16 + ADDR_XOR_TABLE - 1)

const op_shift4 = (scratch = 0) => [
    scratch + ADDR_SHIFT_TABLE,
    OP_ADD,
    OP_PICK,
]

const op_xor_shifted = (scratch = 0) => [
    stats('op_xor_shifted'),
    OP_ADD,
    scratch,
    OP_ADD,
    OP_PICK,
]

const op_xor = (scratch = 0) => [
    stats('op_xor'),
    op_shift4(scratch),
    op_xor_shifted(scratch),
]

const op_xor_constant = (constant, scratch = 0) => {
    stats('op_xor_constant')
    if (constant === 0) 
        return []
    else if(constant === 0x0f)
        return [
            0x0f,
            OP_SWAP,
            OP_SUB,
        ]
    else 
        return [
            constant * 16 + scratch + ADDR_XOR_TABLE - 1,
            OP_ADD,
            OP_PICK,
        ]
}


const drop_tables = loop(
    SIZE_SHIFT_TABLE
    + SIZE_KEY
    + SIZE_SBOX_TABLE
    + SIZE_SBOX_INV_TABLE
    + SIZE_XOR_TABLE
    + SIZE_AND_TABLE * 8, 
    _ => OP_DROP
)


// AND table
const push_and_table_m0 = loop(16, i => M[0] & i).reverse()
const push_and_table_m1 = loop(16, i => M[1] & i).reverse()
const push_and_table_m2 = loop(16, i => M[2] & i).reverse()
const push_and_table_m3 = loop(16, i => M[3] & i).reverse()

const push_and_shift_table_m0 = loop(16, i => (M[0] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m1 = loop(16, i => (M[1] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m2 = loop(16, i => (M[2] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()
const push_and_shift_table_m3 = loop(16, i => (M[3] & i) * 16 + ADDR_XOR_TABLE - 1).reverse()


const push_and_table = [
    push_and_shift_table_m3,
    push_and_shift_table_m2,
    push_and_shift_table_m1,
    push_and_shift_table_m0,
    push_and_table_m3,
    push_and_table_m2,
    push_and_table_m1,
    push_and_table_m0,
]


const op_and_m0 = (scratch = 0) => [
    stats('op_and_m0'),
    scratch + ADDR_AND_M0_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_m1 = (scratch = 0) => [
    stats('op_and_m1'),
    scratch + ADDR_AND_M1_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_m2 = (scratch = 0) => [
    stats('op_and_m2'),
    scratch + ADDR_AND_M2_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_m3 = (scratch = 0) => [
    stats('op_and_m3'),
    scratch + ADDR_AND_M3_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_m = (m, scratch = 0) => {
    stats('op_and_m')
    switch (m) {
        case 0: return op_and_m0(scratch)
        case 1: return op_and_m1(scratch)
        case 2: return op_and_m2(scratch)
        case 3: return op_and_m3(scratch)
    }
}

const op_and_shift_m0 = (scratch = 0) => [
    stats('op_and_shift_m0'),
    scratch + ADDR_AND_M0_SHIFT_TABLE - 1,
    OP_ADD,
    OP_PICK,
]
const op_and_shift_m1 = (scratch = 0) => [
    stats('op_and_shift_m1'),
    scratch + ADDR_AND_M1_SHIFT_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_shift_m2 = (scratch = 0) => [
    stats('op_and_shift_m2'),
    scratch + ADDR_AND_M2_SHIFT_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_shift_m3 = (scratch = 0) => [
    stats('op_and_shift_m3'),
    scratch + ADDR_AND_M3_SHIFT_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

const op_and_shift_m = (m, scratch = 0) => {
    stats('op_and_shift_m')
    switch (m) {
        case 0: return op_and_shift_m0(scratch)
        case 1: return op_and_shift_m1(scratch)
        case 2: return op_and_shift_m2(scratch)
        case 3: return op_and_shift_m3(scratch)
    }
}


const push_sbox_table = PRINCE_SBOX.reverse()

const push_sbox_inv_table = PRINCE_SBOX_INVERSE.reverse()


/*───────────────────────────────────────────────────────────────
 * 2 · PRINCE S‑box tables  (forward + inverse)
 */



/* S‑box look‑up: scratch = scratch items above index nibble (usually 0/16) */
const op_sbox = (scratch = 0) => [
    stats('op_sbox'),
    scratch + ADDR_SBOX_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

/* Inverse S‑box: just add 16 more to skip forward box */
const op_sbox_inv = (scratch = 0) => [
    stats('op_sbox_inv'),
    scratch + ADDR_SBOX_INV_TABLE - 1,
    OP_ADD,
    OP_PICK,
]

/*───────────────────────────────────────────────────────────────
 * 3 · Pointer bookkeeping  (state + key halves)
 */
let ENV = {}
const STATE = i => `state_${i}`

// init pointers
const init_pointers = () => {
    for (let i = 0; i < SIZE_STATE; i++)
        ENV[STATE(i)] = i
}

// Get the position of `identifier`, then delete it
const ptr_extract = identifier => {
    if (!(identifier in ENV))
        throw `Undefined variable ${identifier}`

    const index = ENV[identifier]
    delete ENV[identifier]
    Object.keys(ENV).forEach(key => {
        if (index < ENV[key])
            ENV[key] -= 1
    })
    return index
}

// Set the position of `identifier` to the top stack item
const ptr_insert = identifier => {
    Object.keys(ENV).forEach(key => ENV[key] += 1)
    ENV[identifier] = 0
}


const op_move_state_to_top = (index, scratch = 0) => [
    stats('op_move_state_to_top'),
    ptr_extract(STATE(index)) + scratch,
    OP_ROLL,
    ptr_insert(STATE(index))
]

const op_copy_state_to_top = (index, scratch = 0) => [
    stats('op_copy_state_to_top'),
    ENV[STATE(index)] + scratch,
    OP_PICK
]

const KEY = loop(SIZE_KEY, i => SIZE_KEY - 1 - i + ADDR_KEY)

const op_copy_key_to_top = (index, scratch = 0) => [
    stats('op_copy_key_to_top'),
    KEY[index] + scratch,
    OP_PICK
]



const push_tables = _ => [
    push_and_table,
    push_xor_table,
    push_sbox_inv_table,
    push_sbox_table,
    push_shift_table,
    init_pointers(),
]



/*───────────────────────────────────────────────────────────────
 * 4 ·  MixColumns  
 */



/* build one 4‑nibble “slice” (rows base…base+3) */
const mMultiply = (base, useMHat0, scratch = 0) => {
    /* coefficient selector:   MHat0 ⇒ +0   ·   MHat1 ⇒ +1 */
    const rot = useMHat0 ? 0 : 1;

    /* shorthand: coefficient index for term j in row r              */
    const C_idx = (r, j) => (r + j + rot) & 3;
    const A = [base, base + 1, base + 2, base + 3];

    return [
        // Bring the 4 state nibbles on top of the stack
        op_copy_state_to_top(15 - A[3], scratch + 0),
        op_copy_state_to_top(15 - A[2], scratch + 1),
        op_copy_state_to_top(15 - A[1], scratch + 2),
        op_copy_state_to_top(15 - A[0], scratch + 3),

        // Make 4 copies of the state nibbles
        OP_2OVER, OP_2OVER, 
        OP_2OVER, OP_2OVER,
        OP_2OVER, OP_2OVER,

        // Compute the 4 terms of the row
        loop(4, r => [
            stats('mix_row'),

            /* === compute  (Σ Cᵣⱼ & aⱼ)  ========================== */
            // (1) first term  (C0 & a0)
            op_and_m(C_idx(r, 0), scratch + 4 * (4 - r) - 0),   // C0 & a0   → stack+1

            // (2) ⊕ second term  (C1 & a1)
            OP_SWAP,        // a1
            op_and_shift_m(C_idx(r, 1), scratch + 4 * (4 - r) - 0),   // C1 & a1
            op_xor_shifted(scratch + 4 * (4 - r) - 1),                // partial ⊕   → stack‑1

            // (3) ⊕ third term  (C2 & a2)
            OP_SWAP,    // a2
            op_and_shift_m(C_idx(r, 2), scratch + 4 * (4 - r) - 1),
            op_xor_shifted(scratch + 4 * (4 - r) - 2),

            // (4) ⊕ fourth term (C3 & a3)
            OP_SWAP,    // a3
            op_and_shift_m(C_idx(r, 3), scratch + 4 * (4 - r) - 2),
            op_xor_shifted(scratch + 4 * (4 - r) - 3),                  // result bᵣ on TOS

            OP_TOALTSTACK,
        ]),
        // Replace old state with new state
        loop(4, i => [
            op_move_state_to_top(15 - A[3-i], scratch),          // bring old aᵣ to TOS
            OP_DROP,                                            // discard old nibble
            OP_FROMALTSTACK,
        ]),
    ]
}

/* Whole M‑layer:  0‑3 ×MHat0  ·  4‑7,8‑11 ×MHat1  · 12‑15 ×MHat0 */
const prince_m_layer = _ => [
    stats('prince_m_layer'),
    mMultiply(0, true),     // rows 0‑3
    mMultiply(4, false),     // rows 4‑7
    mMultiply(8, false),     // rows 8‑11
    mMultiply(12, true),     // rows 12‑15
];


const prince_s_layer = _ => loop(SIZE_STATE, i => [
    op_move_state_to_top(i),
    op_sbox()
])

const prince_s_layer_inverse = _ => loop(SIZE_STATE, i => [
    op_move_state_to_top(i),
    op_sbox_inv()
])

/*───────────────────────────────────────────────────────────────
 * 5 · ShiftRows  (pointer relabel only)
 */
const prince_shiftRow = inv => {
    const src = {}
    for (let i = 0; i < SIZE_STATE; i++)
        src[STATE(i)] = ENV[STATE(i)]

    if (inv) {
        PRINCE_SHIFT_INVERSE.forEach((s, d) => ENV[STATE(15 - d)] = src[STATE(15 - s)])
    } else {
        PRINCE_SHIFT.forEach((s, d) => ENV[STATE(15 - d)] = src[STATE(15 - s)])
    }
}

/*───────────────────────────────────────────────────────────────
 * 6 ·  Building blocks
 */

const add_key_rc = r => loop(16, i => [
    stats('add_key_rc'),
    // state nibble
    op_move_state_to_top(i),
    // XOR with key (k1 for odd, k0 for even)
    op_copy_key_to_top((r % 2 ? i + 16 : i)),
    // XOR with key
    op_xor_shifted(),
    // XOR with round constant
    op_xor_constant(RC[r][i]),
])

// Forward round
const prince_roundForward = r => {
    return [
        // S‑box layer
        prince_s_layer(),
        // MixColumns
        prince_m_layer(),
        // ShiftRows pointer bookkeeping (no opcodes emitted)
        prince_shiftRow(false),
        // AddRoundKey+RC
        add_key_rc(r)
    ]
}

// Inverse round
const prince_roundInverse = r => {
    return [
        // AddRoundKey+RC
        add_key_rc(r),

        // Apply inverse ShiftRows by pointer relabel
        prince_shiftRow(true),

        // MixColumns
        prince_m_layer(),

        // Inverse S‑box layer
        prince_s_layer_inverse(),
    ]
}

// Middle layer R′  = SB⁻¹ ◦ ⊕(k1⊕RC11) ◦ MC ◦ ⊕k0 ◦ SB
const middle = _ => [
    // SB layer
    prince_s_layer(),
    // ⊕ k0
    loop(SIZE_STATE, i => [
        op_move_state_to_top(i),
        op_copy_key_to_top(i),
        op_xor_shifted() 
    ]),
    // MC
    prince_m_layer(),
    // ⊕ (k1 ⊕ RC11)
    loop(SIZE_STATE, i => [
        op_move_state_to_top(i),
        op_copy_key_to_top(i + SIZE_STATE),
        op_xor_shifted(),
        op_xor_constant(BETA[i]),
    ]),
    // SB⁻¹
    prince_s_layer_inverse()
]



const op_load_key = () => loop(SIZE_KEY, i => [
    OP_DEPTH,
    OP_1SUB,
    OP_ROLL,
    // shift the key by 4 bits to prepare for XOR
    op_shift4(i - SIZE_STATE - SIZE_KEY),
])

const op_load_msg = () => loop(SIZE_STATE, i => [
    OP_DEPTH,
    OP_1SUB,
    OP_ROLL,
])

const op_final_whitening = i => [
    op_move_state_to_top(i),
    op_copy_key_to_top(i + SIZE_STATE),
    op_xor_shifted(),            // XOR the state with k1
    op_xor_constant(BETA[i]),    // XORs the result with BETA
]

const princev2_encrypt = [
    push_tables(),
    
    /* Roll key and msg to top of the stack */
    op_load_key(),
    op_load_msg(),
    
    /* Initial whitening with k0 */
    loop(SIZE_STATE, i => [
        op_move_state_to_top(i),
        op_copy_key_to_top(i),
        op_xor_shifted()
    ]),

    /* 5 forward rounds (1..5) */
    loop(NUM_OF_ROUNDS/2 - 1, i => prince_roundForward(i + 1)),

    /* middle R′ */
    middle(),

    /* 5 inverse rounds (6..10) */
    loop(NUM_OF_ROUNDS/2 - 1, i => prince_roundInverse(NUM_OF_ROUNDS/2 + i)),

    
    /* final whitening with (k1 ^ BETA) */
    loop(SIZE_STATE, i => op_final_whitening(SIZE_STATE - 1 - i)),


    /* Move result to altstack */
    loop(SIZE_STATE, _ => OP_TOALTSTACK),
    /* drop tables  */
    drop_tables,
    /* Read result from altstack */
    loop(SIZE_STATE, _ => OP_FROMALTSTACK),
 
];





// // Test case
// const push_dummy_key = loop(SIZE_KEY, i  => 0)
// const push_dummy_msg = loop(SIZE_STATE, i => 0);

// [
//     push_dummy_key,
//     push_dummy_msg,
//     princev2_encrypt,
//     console.table(window.STATS)
// ]





// Possible optimizations: 
// Optimize table pushes using copy opcodes instead of push opcodes

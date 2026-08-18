/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                             *
 *          PRINCE‑v2 Bitcoin Script generator (~7.42 KiB)     *
 *                                                             *
 *                              by 1ˣ Group – August 2026      *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Helper function to split a 64-bit number into 16 nibbles
function split_into_nibbles(x) {
    return [...Array(16)]
        .map((_, i) => Number((x >> BigInt(4 * (15 - i))) & 0xfn))
        .reverse()
}

window.STATS = {}

const stats = name => {
    if (!window.STATS[name]) {
        window.STATS[name] = 1
        return
    }

    window.STATS[name]++
}

/*───────────────────────────────────────────────────────────────
 * 0 · Constants
 */

const NUM_OF_ROUNDS = 12

const RC = [
    0x0000000000000000n,
    0x13198a2e03707344n,
    0xa4093822299f31d0n,
    0x082efa98ec4e6c89n,
    0x452821e638d01377n,
    0xbe5466cf34e90c6cn,
    0x7ef84f78fd955cb1n,
    0x7aacf4538d971a60n,
    0xc882d32f25323c54n,
    0x9b8ded979cd838c7n,
    0xd3b5a399ca0c2399n,
    0x3f84d5b5b5470917n
].map(split_into_nibbles)

const BETA = split_into_nibbles(0x3f84d5b5b5470917n)

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

const M = [0x7, 0xb, 0xd, 0xe]

const SIZE_STATE = 16
const SIZE_KEY = 32
const SIZE_SHIFT_TABLE = 16
const SIZE_SBOX_TABLE = 16
const SIZE_SBOX_INV_TABLE = 16
const SIZE_XOR_TABLE = 256
const SIZE_AND_TABLE = 16
const SIZE_SBOX_XOR_TABLES = SIZE_SBOX_TABLE * 6
const SIZE_SBOX_INV_XOR_TABLES = SIZE_SBOX_INV_TABLE * 7
const SIZE_MEMORY = 674

/*───────────────────────────────────────────────────────────────
 * 0.5 · Compile-time exhaustive search helpers
 *
 * All 24 permutations of [0,1,2,3] are precomputed once.
 *
 * rollCost() returns the encoded byte size of an OP_ROLL at a
 * given stack position, matching Bitcoin Script number encoding:
 *
 *   0       → 0 bytes
 *   1       → 1 byte  (OP_SWAP)
 *   2       → 1 byte  (OP_ROT)
 *   3–16    → 2 bytes
 *   17–127  → 3 bytes
 *   128–255 → 4 bytes
 */

const PERMS_4 = (() => {
    const result = []
    const arr = [0, 1, 2, 3]

    const permute = (a, l = 0) => {
        if (l === a.length - 1) {
            result.push([...a])
            return
        }

        for (let i = l; i < a.length; i++) {
            ;[a[l], a[i]] = [a[i], a[l]]
            permute(a, l + 1)
            ;[a[l], a[i]] = [a[i], a[l]]
        }
    }

    permute(arr)
    return result
})()

function scriptNumPushCost(n) {
    if (n === 0) {
        return 1
    }

    if (n === -1 || (n >= 1 && n <= 16)) {
        return 1
    }

    let v = Math.abs(n)
    let bytes = 0
    let last = 0

    while (v > 0) {
        last = v & 0xff
        bytes++
        v = Math.floor(v / 256)
    }

    if (last & 0x80) {
        bytes++
    }

    return 1 + bytes
}

function rollCost(pos) {
    if (pos === 0) {
        return 0
    }

    if (pos === 1 || pos === 2) {
        return 1
    }

    return scriptNumPushCost(pos) + 1
}

function xorShiftedCost(scratch) {
    if (scratch === 0) {
        return 2
    }

    if (scratch === 1 || scratch === -1) {
        return 3
    }

    return 3 + scriptNumPushCost(Math.abs(scratch))
}

function mhatCoreCostForPerm(perm, rot, scratch = 0) {
    const stack_map = [
        perm[3],
        perm[2],
        perm[1],
        perm[0]
    ]

    const C_idx = (r, j) =>
        (stack_map[r] + stack_map[j] + rot) & 3

    let cost = 0

    for (let r = 0; r < 4; r++) {
        const s = scratch + 4 * (3 - r)
        const c1 = C_idx(r, 1)
        const c2 = C_idx(r, 2)
        const c3 = C_idx(r, 3)

        cost += xorShiftedCost(
            s - 1 - AND_VALUE_BIAS - XOR_SHIFT_BIAS[c1]
        )

        cost += xorShiftedCost(
            s - 2 - XOR_SHIFT_BIAS[c2]
        )

        cost += xorShiftedCost(
            s - 3 - XOR_SHIFT_BIAS[c3]
        )
    }

    return cost
}

function cloneEnv(env) {
    const copy = {}

    for (const key of Object.keys(env)) {
        copy[key] = env[key]
    }

    return copy
}

function simPtrExtract(env, stateKey) {
    const idx = env[stateKey]

    delete env[stateKey]

    for (const key of Object.keys(env)) {
        if (env[key] > idx) {
            env[key]--
        }
    }

    return idx
}

function simPtrInsert(env, stateKey) {
    for (const key of Object.keys(env)) {
        env[key]++
    }

    env[stateKey] = 0
}

function bestMHatPermForEnv(
    env,
    stateIndices,
    rot,
    scratch = 0
) {
    let bestPerm = [3, 2, 1, 0]
    let bestCost = Infinity

    for (const perm of PERMS_4) {
        const simEnv = cloneEnv(env)
        let cost = mhatCoreCostForPerm(
            perm,
            rot,
            scratch
        )

        for (const j of perm) {
            const stateKey = STATE(stateIndices[j])
            const pos = simEnv[stateKey] + scratch

            cost += rollCost(pos)

            simPtrExtract(simEnv, stateKey)
            simPtrInsert(simEnv, stateKey)
        }

        if (cost < bestCost) {
            bestCost = cost
            bestPerm = [...perm]
        }
    }

    return {
        perm: bestPerm,
        cost: bestCost
    }
}

/*───────────────────────────────────────────────────────────────
 * 1 · Memory topology
 */

const ADDR_STATE = 0
const ADDR_KEY = 80

// Hot tables
const ADDR_SBOX_TABLE = 16
const ADDR_PAIR01_ROW_TABLE = 32
const ADDR_PAIR23_ROW_TABLE = 48
const ADDR_PAIR01_FINAL_ROW_TABLE = 64

// Key remap table
const ADDR_SHIFT_TABLE = 112

// Common packed nibble table
const ADDR_NIBBLE_TABLE = 128
const ADDR_SBOX_INV_TABLE = ADDR_NIBBLE_TABLE
const ADDR_XOR_TABLE = ADDR_NIBBLE_TABLE
const ADDR_PAIR23_TABLE = ADDR_NIBBLE_TABLE
const ADDR_PAIR01_TABLE = 578

const ADDR_SBOX_INV_XOR_12_TABLE =
    ADDR_NIBBLE_TABLE + 333

const ADDR_SBOX_INV_XOR_8_TABLE =
    ADDR_NIBBLE_TABLE + 434

const ADDR_SBOX_INV_XOR_3_TABLE =
    ADDR_NIBBLE_TABLE + 388

const ADDR_SBOX_INV_XOR_9_TABLE =
    ADDR_NIBBLE_TABLE + 373

const ADDR_SBOX_INV_XOR_5_TABLE =
    ADDR_NIBBLE_TABLE + 418

const ADDR_SBOX_INV_XOR_13_TABLE =
    ADDR_NIBBLE_TABLE + 150

const ADDR_SBOX_INV_XOR_7_TABLE =
    ADDR_NIBBLE_TABLE + 165

const ADDR_SBOX_XOR_1_TABLE =
    ADDR_NIBBLE_TABLE + 357

const ADDR_SBOX_XOR_2_TABLE =
    ADDR_NIBBLE_TABLE + 298

const ADDR_SBOX_XOR_3_TABLE =
    ADDR_NIBBLE_TABLE + 403

const ADDR_SBOX_XOR_4_TABLE =
    ADDR_NIBBLE_TABLE + 192

const ADDR_SBOX_XOR_6_TABLE =
    ADDR_NIBBLE_TABLE + 318

const ADDR_SBOX_XOR_8_TABLE =
    ADDR_NIBBLE_TABLE + 180

const ADDR_SBOX_XOR_9_TABLE =
    ADDR_NIBBLE_TABLE + 349

const ADDR_SBOX_XOR_12_TABLE =
    ADDR_NIBBLE_TABLE + 200

const ADDR_SBOX_XOR_14_TABLE =
    ADDR_NIBBLE_TABLE + 310

// Compatibility aliases for compile-time helpers that are no longer
// emitted by the pair-table M-hat core.
const ADDR_AND_M0_SHIFT_TABLE = 32
const ADDR_AND_M1_SHIFT_TABLE = 48
const ADDR_AND_M2_SHIFT_TABLE = 32
const ADDR_AND_M3_SHIFT_TABLE = 48

const ADDR_AND_M0_TABLE = ADDR_PAIR01_TABLE
const ADDR_AND_M1_TABLE = ADDR_PAIR01_TABLE
const ADDR_AND_M2_TABLE = ADDR_PAIR23_TABLE
const ADDR_AND_M3_TABLE = ADDR_PAIR23_TABLE

const AND_VALUE_BIAS = 6
const XOR_SHIFT_BIAS = [1, 1, 5, -3]

/*───────────────────────────────────────────────────────────────
 * 1.1 · Lookup-table packing
 */

const pack_lookup_rows = (
    rowsByKey,
    rowOrder
) => {
    const values = []
    const offsets = {}

    const overlap = (a, b) => {
        for (
            let n = Math.min(a.length, b.length);
            n > 0;
            n--
        ) {
            let equal = true

            for (let i = 0; i < n; i++) {
                if (
                    a[a.length - n + i] !== b[i]
                ) {
                    equal = false
                    break
                }
            }

            if (equal) {
                return n
            }
        }

        return 0
    }

    rowOrder.forEach((key, i) => {
        const row = rowsByKey[key]

        if (i === 0) {
            offsets[key] = 0
            values.push(...row)
            return
        }

        const previous =
            rowsByKey[rowOrder[i - 1]]

        const n = overlap(previous, row)

        offsets[key] = values.length - n
        values.push(...row.slice(n))
    })

    return {
        values,
        offsets
    }
}

// One shortest-superstring pack for all cold nibble lookup rows.
// This order is weighted for serialized Script size rather than only
// minimizing the retained table-entry count.
const COLD_NIBBLE_PACK_ORDER = [
    "SI",

    "X4",
    "X12",

    "P4",
    "P0",
    "X0",
    "P12",
    "P8",
    "X8",

    "P6",
    "P2",
    "X2",
    "X14",
    "X6",
    "P14",
    "P10",
    "X10",

    "I13",
    "I7",

    "F8",
    "F4",
    "F12",

    "X3",
    "X11",
    "X7",
    "X15",
    "X1",
    "X9",
    "X5",
    "X13",

    "F2",
    "F14",
    "F6",

    "I12",

    "F9",
    "F1",

    "I9",
    "I3",

    "F3",

    "I5",
    "I8"
]

const XOR_ROWS = loop(
    16,
    row => loop(
        16,
        value => row ^ value
    )
)

const PAIR23_ROWS = Object.fromEntries(
    loop(8, i => 2 * i).map(u => [
        u,

        loop(
            16,
            x0 =>
                (u & M[3]) ^
                (x0 & M[0])
        )
    ])
)

const COLD_NIBBLE_ROWS = Object.fromEntries([
    [
        "SI",
        PRINCE_SBOX_INVERSE
    ],

    ...loop(16, row => [
        `X${row}`,
        XOR_ROWS[row]
    ]),

    ...loop(8, i => 2 * i).map(u => [
        `P${u}`,
        PAIR23_ROWS[u]
    ]),

    ...[3, 5, 7, 8, 9, 12, 13].map(
        constant => [
            `I${constant}`,

            loop(
                16,
                i =>
                    PRINCE_SBOX_INVERSE[i] ^
                    constant
            )
        ]
    ),

    ...[1, 2, 3, 4, 6, 8, 9, 12, 14].map(
        constant => [
            `F${constant}`,

            loop(
                16,
                i =>
                    PRINCE_SBOX[
                        i ^ constant
                    ]
            )
        ]
    )
])

const COLD_NIBBLE_PACKED = pack_lookup_rows(
    COLD_NIBBLE_ROWS,
    COLD_NIBBLE_PACK_ORDER
)

const XOR_ROW_OFFSET = Object.fromEntries(
    loop(16, row => [
        row,
        COLD_NIBBLE_PACKED.offsets[
            `X${row}`
        ]
    ])
)

const PAIR23_ROW_OFFSET = Object.fromEntries(
    loop(8, i => 2 * i).map(u => [
        u,
        COLD_NIBBLE_PACKED.offsets[
            `P${u}`
        ]
    ])
)

// Values are listed deepest-first for the Script builder.
const push_cold_nibble_table =
    COLD_NIBBLE_PACKED.values
        .slice()
        .reverse()

const push_shift_table = loop(
    16,
    i =>
        XOR_ROW_OFFSET[i] +
        ADDR_XOR_TABLE -
        1
).reverse()

// Retained compatibility tables
const push_and_table_m0 = loop(
    16,
    i => (M[0] & i) + AND_VALUE_BIAS
).reverse()

const push_and_table_m1 = loop(
    16,
    i => (M[1] & i) + AND_VALUE_BIAS
).reverse()

const push_and_table_m2 = loop(
    16,
    i => (M[2] & i) + AND_VALUE_BIAS
).reverse()

const push_and_table_m3 = loop(
    16,
    i => (M[3] & i) + AND_VALUE_BIAS
).reverse()

const push_and_shift_table_m0 = loop(
    16,
    i =>
        XOR_ROW_OFFSET[M[0] & i] +
        ADDR_XOR_TABLE -
        1 +
        XOR_SHIFT_BIAS[0]
).reverse()

const push_and_shift_table_m1 = loop(
    16,
    i =>
        XOR_ROW_OFFSET[M[1] & i] +
        ADDR_XOR_TABLE -
        1 +
        XOR_SHIFT_BIAS[1]
).reverse()

const push_and_shift_table_m2 = loop(
    16,
    i =>
        XOR_ROW_OFFSET[M[2] & i] +
        ADDR_XOR_TABLE -
        1 +
        XOR_SHIFT_BIAS[2]
).reverse()

const push_and_shift_table_m3 = loop(
    16,
    i =>
        XOR_ROW_OFFSET[M[3] & i] +
        ADDR_XOR_TABLE -
        1 +
        XOR_SHIFT_BIAS[3]
).reverse()

const push_sbox_table =
    PRINCE_SBOX.slice().reverse()

const push_sbox_inv_table =
    PRINCE_SBOX_INVERSE.slice().reverse()

const push_sbox_xor_2_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 2]
).reverse()

const push_sbox_xor_3_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 3]
).reverse()

const push_sbox_xor_4_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 4]
).reverse()

const push_sbox_xor_8_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 8]
).reverse()

const push_sbox_xor_9_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 9]
).reverse()

const push_sbox_xor_14_table = loop(
    16,
    i => PRINCE_SBOX[i ^ 14]
).reverse()

const push_sbox_inv_xor_3_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 3
).reverse()

const push_sbox_inv_xor_5_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 5
).reverse()

const push_sbox_inv_xor_7_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 7
).reverse()

const push_sbox_inv_xor_8_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 8
).reverse()

const push_sbox_inv_xor_9_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 9
).reverse()

const push_sbox_inv_xor_12_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 12
).reverse()

const push_sbox_inv_xor_13_table = loop(
    16,
    i => PRINCE_SBOX_INVERSE[i] ^ 13
).reverse()

/*───────────────────────────────────────────────────────────────
 * 1.2 · Pair tables
 */

const pair12 = (x1, x2) =>
    (x1 & M[1]) ^
    (x2 & M[2])

const pair30 = (x3, x0) =>
    (x3 & M[3]) ^
    (x0 & M[0])

const PAIR01_ROW_KEYS = [
    0,
    8,
    9,
    1,
    2,
    10,
    11,
    3
]

const PAIR01_ROWS = Object.fromEntries(
    [0, 1, 2, 3, 8, 9, 10, 11].map(
        u => [
            u,

            loop(
                16,
                x2 =>
                    XOR_ROW_OFFSET[
                        pair12(u, x2)
                    ] +
                    ADDR_XOR_TABLE
            )
        ]
    )
)

const PAIR01_PACKED = pack_lookup_rows(
    PAIR01_ROWS,
    PAIR01_ROW_KEYS
)

const push_pair01_table =
    PAIR01_PACKED.values
        .slice()
        .reverse()

// During ordinary pair12 lookup, two working nibbles remain above
// the pair table.
const push_pair01_row_table = loop(
    16,
    x =>
        ADDR_PAIR01_TABLE +
        2 +
        PAIR01_PACKED.offsets[
            x & M[1]
        ]
).reverse()

// During pair30 lookup, one working item remains above the table.
const push_pair23_row_table = loop(
    16,
    x =>
        ADDR_PAIR23_TABLE +
        1 +
        PAIR23_ROW_OFFSET[
            x & M[3]
        ]
).reverse()

// The destructive fourth M-hat row uses a separate hot pointer map.
const push_pair01_final_row_table = loop(
    16,
    x =>
        ADDR_PAIR01_TABLE -
        2 +
        PAIR01_PACKED.offsets[
            x & M[1]
        ]
).reverse()

/*───────────────────────────────────────────────────────────────
 * 1.3 · Static-table push optimizer
 */

const flatten_push_values = (
    value,
    out = []
) => {
    if (Array.isArray(value)) {
        value.forEach(
            item =>
                flatten_push_values(item, out)
        )
    } else if (
        value !== undefined &&
        value !== null
    ) {
        out.push(value)
    }

    return out
}

const optimize_push_sequence = nestedValues => {
    const values =
        flatten_push_values(nestedValues)

    const n = values.length
    const dp = Array(n + 1).fill(Infinity)
    const previous = Array(n + 1).fill(null)

    const update = (
        to,
        cost,
        from,
        emit
    ) => {
        if (cost < dp[to]) {
            dp[to] = cost

            previous[to] = {
                from,
                emit
            }
        }
    }

    dp[0] = 0

    for (let i = 0; i < n; i++) {
        if (!Number.isFinite(dp[i])) {
            continue
        }

        update(
            i + 1,
            dp[i] + scriptNumPushCost(values[i]),
            i,
            [values[i]]
        )

        if (
            i >= 1 &&
            values[i - 1] === values[i]
        ) {
            update(
                i + 1,
                dp[i] + 1,
                i,
                [OP_DUP]
            )
        }

        if (
            i >= 2 &&
            values[i - 2] === values[i]
        ) {
            update(
                i + 1,
                dp[i] + 1,
                i,
                [OP_OVER]
            )
        }

        for (
            let depth = 2;
            depth <= 16 && depth < i;
            depth++
        ) {
            if (
                values[i - 1 - depth] ===
                values[i]
            ) {
                update(
                    i + 1,
                    dp[i] +
                        scriptNumPushCost(depth) +
                        1,
                    i,
                    [depth, OP_PICK]
                )
            }
        }

        if (
            i >= 2 &&
            i + 2 <= n &&
            values[i] === values[i - 2] &&
            values[i + 1] === values[i - 1]
        ) {
            update(
                i + 2,
                dp[i] + 1,
                i,
                [OP_2DUP]
            )
        }

        if (
            i >= 3 &&
            i + 3 <= n &&
            values[i] === values[i - 3] &&
            values[i + 1] === values[i - 2] &&
            values[i + 2] === values[i - 1]
        ) {
            update(
                i + 3,
                dp[i] + 1,
                i,
                [OP_3DUP]
            )
        }

        if (
            i >= 4 &&
            i + 2 <= n &&
            values[i] === values[i - 4] &&
            values[i + 1] === values[i - 3]
        ) {
            update(
                i + 2,
                dp[i] + 1,
                i,
                [OP_2OVER]
            )
        }
    }

    const out = []

    for (let i = n; i > 0;) {
        const step = previous[i]

        if (!step) {
            throw new Error(
                `push optimizer failed at ${i}`
            )
        }

        out.unshift(...step.emit)
        i = step.from
    }

    return out
}

const push_tables_cold_raw = _ => [
    // Deepest first, topmost last.
    push_pair01_table,
    push_cold_nibble_table,
    push_shift_table
]

const push_tables_hot_raw = _ => [
    push_pair01_final_row_table,
    push_pair23_row_table,
    push_pair01_row_table,
    push_sbox_table
]

const push_tables_cold = _ =>
    optimize_push_sequence(
        push_tables_cold_raw()
    )

const push_tables_hot = _ =>
    optimize_push_sequence(
        push_tables_hot_raw()
    )

const drop_tables = [
    loop(
        Math.floor(
            (SIZE_MEMORY - SIZE_STATE) / 2
        ),
        _ => OP_2DROP
    ),

    (SIZE_MEMORY - SIZE_STATE) & 1
        ? OP_DROP
        : []
]

/*───────────────────────────────────────────────────────────────
 * 1.4 · Lookup operations
 */

const op_shift4 = (scratch = 0) => [
    scratch + ADDR_SHIFT_TABLE,
    OP_ADD,
    OP_PICK
]

const op_xor_shifted = (
    scratch = 0
) => {
    if (scratch === 0) {
        return [
            OP_ADD,
            OP_PICK
        ]
    }

    if (scratch === 1) {
        return [
            OP_ADD,
            OP_1ADD,
            OP_PICK
        ]
    }

    if (scratch === -1) {
        return [
            OP_ADD,
            OP_1SUB,
            OP_PICK
        ]
    }

    return [
        OP_ADD,

        scratch > 0
            ? [
                scratch,
                OP_ADD
            ]
            : [
                -scratch,
                OP_SUB
            ],

        OP_PICK
    ]
}

const op_xor_constant = (
    constant,
    scratch = 0
) => {
    if (constant === 0) {
        return []
    }

    if (constant === 0x0f) {
        return [
            0x0f,
            OP_SWAP,
            OP_SUB
        ]
    }

    return [
        XOR_ROW_OFFSET[constant] +
            scratch +
            ADDR_XOR_TABLE -
            1,

        OP_ADD,
        OP_PICK
    ]
}

const op_and_m = (
    m,
    scratch = 0
) => {
    const base = [
        ADDR_AND_M0_TABLE,
        ADDR_AND_M1_TABLE,
        ADDR_AND_M2_TABLE,
        ADDR_AND_M3_TABLE
    ][m]

    return [
        scratch + base - 1,
        OP_ADD,
        OP_PICK
    ]
}

const op_and_m_shift = (
    m,
    scratch = 0
) => {
    const base = [
        ADDR_AND_M0_SHIFT_TABLE,
        ADDR_AND_M1_SHIFT_TABLE,
        ADDR_AND_M2_SHIFT_TABLE,
        ADDR_AND_M3_SHIFT_TABLE
    ][m]

    return [
        scratch + base - 1,
        OP_ADD,
        OP_PICK
    ]
}

const op_sbox = (scratch = 0) => [
    scratch + ADDR_SBOX_TABLE - 1,
    OP_ADD,
    OP_PICK
]

const op_sbox_xor_constant = (
    constant,
    scratch = 0
) => {
    switch (constant) {
        case 1:
            return [
                ADDR_SBOX_XOR_1_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 2:
            return [
                ADDR_SBOX_XOR_2_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 3:
            return [
                ADDR_SBOX_XOR_3_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 4:
            return [
                ADDR_SBOX_XOR_4_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 6:
            return [
                ADDR_SBOX_XOR_6_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 8:
            return [
                ADDR_SBOX_XOR_8_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 9:
            return [
                ADDR_SBOX_XOR_9_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 12:
            return [
                ADDR_SBOX_XOR_12_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 14:
            return [
                ADDR_SBOX_XOR_14_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        default:
            return [
                op_xor_constant(
                    constant,
                    scratch
                ),

                op_sbox(scratch)
            ]
    }
}

const op_sbox_inv = (scratch = 0) => [
    scratch + ADDR_SBOX_INV_TABLE - 1,
    OP_ADD,
    OP_PICK
]

const op_sbox_inv_xor_constant = (
    constant,
    scratch = 0
) => {
    switch (constant) {
        case 3:
            return [
                ADDR_SBOX_INV_XOR_3_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 5:
            return [
                ADDR_SBOX_INV_XOR_5_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 7:
            return [
                ADDR_SBOX_INV_XOR_7_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 8:
            return [
                ADDR_SBOX_INV_XOR_8_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 9:
            return [
                ADDR_SBOX_INV_XOR_9_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 12:
            return [
                ADDR_SBOX_INV_XOR_12_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        case 13:
            return [
                ADDR_SBOX_INV_XOR_13_TABLE -
                    1 +
                    scratch,

                OP_ADD,
                OP_PICK
            ]

        default:
            return [
                op_sbox_inv(scratch),

                op_xor_constant(
                    constant,
                    scratch
                )
            ]
    }
}

/*───────────────────────────────────────────────────────────────
 * 2 · Pointer bookkeeping
 */

let ENV = {}

const STATE = i =>
    `state_${i}`

const init_pointers = () => {
    for (
        let i = 0;
        i < SIZE_STATE;
        i++
    ) {
        ENV[STATE(i)] = i
    }
}

const ptr_extract = identifier => {
    if (!(identifier in ENV)) {
        throw `Undefined variable ${identifier}`
    }

    const index = ENV[identifier]

    delete ENV[identifier]

    Object.keys(ENV).forEach(key => {
        if (index < ENV[key]) {
            ENV[key]--
        }
    })

    return index
}

const ptr_insert = identifier => {
    Object.keys(ENV).forEach(key => {
        ENV[key]++
    })

    ENV[identifier] = 0
}

const op_move_state_to_top = (
    index,
    scratch = 0
) => {
    const pos =
        ptr_extract(STATE(index)) +
        scratch

    ptr_insert(STATE(index))

    if (pos === 0) {
        return []
    }

    if (pos === 1) {
        return [OP_SWAP]
    }

    if (pos === 2) {
        return [OP_ROT]
    }

    return [
        pos,
        OP_ROLL
    ]
}

const KEY = loop(
    SIZE_KEY,
    i =>
        SIZE_KEY -
        1 -
        i +
        ADDR_KEY
)

const op_copy_key_to_top = (
    index,
    scratch = 0
) => {
    const pos =
        KEY[index] +
        scratch

    if (pos === 0) {
        return [OP_DUP]
    }

    if (pos === 1) {
        return [OP_OVER]
    }

    return [
        pos,
        OP_PICK
    ]
}

/*───────────────────────────────────────────────────────────────
 * 3 · Engine execution pipeline
 */

const PREP_PREFIXES = (() => {
    const primitives = [
        {
            emit: [OP_SWAP],
            kind: "roll",
            depth: 1
        },

        {
            emit: [OP_ROT],
            kind: "roll",
            depth: 2
        },

        {
            emit: [OP_2SWAP],
            kind: "2swap"
        },

        {
            emit: [OP_2ROT],
            kind: "2rot"
        }
    ]

    const out = [[]]
    let frontier = [[]]

    for (let depth = 0; depth < 3; depth++) {
        const next = []

        for (const prefix of frontier) {
            for (const op of primitives) {
                next.push([
                    ...prefix,
                    op
                ])
            }
        }

        out.push(...next)
        frontier = next
    }

    return out
})()

const envTopOrder = env =>
    Object.entries(env)
        .sort((a, b) => a[1] - b[1])
        .map(
            ([key]) =>
                Number(key.slice(6))
        )

const applyPrepOp = (
    order,
    op
) => {
    const out = order.slice()

    if (op.kind === "roll") {
        const value =
            out.splice(op.depth, 1)[0]

        out.unshift(value)
    } else if (op.kind === "2swap") {
        out.splice(
            0,
            4,
            out[2],
            out[3],
            out[0],
            out[1]
        )
    } else if (op.kind === "2rot") {
        out.splice(
            0,
            6,
            out[4],
            out[5],
            out[0],
            out[1],
            out[2],
            out[3]
        )
    }

    return out
}

const moveStateInOrder = (
    order,
    stateIndex
) => {
    const pos =
        order.indexOf(stateIndex)

    if (pos < 0) {
        throw new Error(
            `state ${stateIndex} missing from simulated stack`
        )
    }

    if (pos === 0) {
        return {
            order: order.slice(),
            emit: [],
            cost: 0
        }
    }

    const next = order.slice()
    const value =
        next.splice(pos, 1)[0]

    next.unshift(value)

    if (pos === 1) {
        return {
            order: next,
            emit: [OP_SWAP],
            cost: 1
        }
    }

    if (pos === 2) {
        return {
            order: next,
            emit: [OP_ROT],
            cost: 1
        }
    }

    return {
        order: next,
        emit: [
            pos,
            OP_ROLL
        ],
        cost: rollCost(pos)
    }
}

const simPairGroup = (
    env,
    stateIndices,
    rot,
    k
) => {
    const goal = loop(
        4,
        j =>
            stateIndices[(k + j) & 3]
    )

    const targetBit = Object.fromEntries(
        stateIndices.map(
            (stateIndex, j) => [
                stateIndex,
                1 << j
            ]
        )
    )

    let bestPrep = null

    for (const prefix of PREP_PREFIXES) {
        let order = envTopOrder(env)

        let visited =
            targetBit[order[0]] || 0

        const prefixSteps = []
        let prefixCost = 0

        for (const op of prefix) {
            order = applyPrepOp(order, op)
            prefixCost++

            const bit =
                targetBit[order[0]] || 0

            const action =
                bit && !(visited & bit)
                    ? order[0]
                    : null

            visited |= bit

            prefixSteps.push({
                emit: op.emit,
                action
            })
        }

        // Every unvisited target must be moved. Already-visited targets
        // are optional; enumerate them because one can be required to
        // finish in the cyclic orientation used by the pair core.
        for (
            let moveMask = 0;
            moveMask < 16;
            moveMask++
        ) {
            if (
                ((moveMask | visited) & 15) !==
                15
            ) {
                continue
            }

            let candidateOrder =
                order.slice()

            let candidateVisited =
                visited

            let candidateCost =
                prefixCost

            const steps = prefixSteps.map(
                step => ({
                    emit: step.emit,
                    action: step.action
                })
            )

            for (
                let goalIndex = 3;
                goalIndex >= 0;
                goalIndex--
            ) {
                const stateIndex =
                    goal[goalIndex]

                const bit =
                    targetBit[stateIndex]

                if (!(moveMask & bit)) {
                    continue
                }

                const moved =
                    moveStateInOrder(
                        candidateOrder,
                        stateIndex
                    )

                candidateOrder =
                    moved.order

                candidateCost +=
                    moved.cost

                const action =
                    !(candidateVisited & bit)
                        ? stateIndex
                        : null

                candidateVisited |= bit

                steps.push({
                    emit: moved.emit,
                    action
                })
            }

            if (candidateVisited !== 15) {
                continue
            }

            if (
                !goal.every(
                    (stateIndex, i) =>
                        candidateOrder[i] ===
                        stateIndex
                )
            ) {
                continue
            }

            const topBefore =
                envTopOrder(env)[0]

            const initialAction =
                targetBit[topBefore]
                    ? topBefore
                    : null

            if (
                !bestPrep ||
                candidateCost < bestPrep.cost
            ) {
                bestPrep = {
                    cost: candidateCost,
                    order: candidateOrder,
                    steps,
                    initialAction
                }
            }
        }
    }

    if (!bestPrep) {
        throw new Error(
            "failed to prepare cyclic M-hat quartet"
        )
    }

    const stackMap = loop(
        4,
        j => (k + j) & 3
    )

    const phase =
        (2 * k + rot - 1) & 3

    const orientationPath = [
        0,
        2,
        3,
        1
    ]

    const rowOrder =
        orientationPath.map(
            t => (t - phase) & 3
        )

    const simEnv = {}

    bestPrep.order.forEach(
        (stateIndex, depth) => {
            simEnv[STATE(stateIndex)] = depth
        }
    )

    // The fourth row is evaluated directly on the original quartet
    // after restoring the first three outputs from the alt stack.
    // The resulting top-to-bottom physical order is:
    // [row3, row0, row1, row2].
    rowOrder.forEach((row, outPos) => {
        const logical =
            stateIndices[stackMap[row]]

        simEnv[STATE(logical)] =
            (outPos + 1) & 3
    })

    return {
        env: simEnv,
        cost: 83 + bestPrep.cost,
        k,
        stackMap,
        rowOrder,
        prep: bestPrep
    }
}

const bestPairGroupForEnv = (
    env,
    stateIndices,
    rot
) => {
    let best = null

    for (let k = 0; k < 4; k++) {
        const candidate = simPairGroup(
            env,
            stateIndices,
            rot,
            k
        )

        if (
            !best ||
            candidate.cost < best.cost
        ) {
            best = candidate
        }
    }

    return best
}

const emitBaseRotation = delta => {
    switch (delta & 3) {
        case 0:
            return []

        case 1:
            return [
                3,
                OP_ROLL
            ]

        case 2:
            return [
                OP_2SWAP
            ]

        case 3:
            return [
                OP_2SWAP,
                3,
                OP_ROLL
            ]
    }
}

const prince_MHatMultiply = (
    base,
    useMHat0,
    pre_action = null
) => {
    const rot =
        useMHat0
            ? 0
            : 1

    const stateIndices = loop(
        4,
        j => 15 - (base + j)
    )

    const plan = bestPairGroupForEnv(
        ENV,
        stateIndices,
        rot
    )

    const emitted = []

    if (
        plan.prep.initialAction !== null &&
        pre_action
    ) {
        emitted.push(
            pre_action(
                plan.prep.initialAction
            )
        )
    }

    for (const step of plan.prep.steps) {
        emitted.push(step.emit)

        if (
            step.action !== null &&
            pre_action
        ) {
            emitted.push(
                pre_action(step.action)
            )
        }
    }

    let orientation = 0

    for (
        let outputIndex = 0;
        outputIndex < plan.rowOrder.length;
        outputIndex++
    ) {
        const targetOrientation = [
            0,
            2,
            3,
            1
        ][outputIndex]

        const finalRow =
            outputIndex === 3

        emitted.push(
            emitBaseRotation(
                (
                    targetOrientation -
                    orientation
                ) & 3
            ),

            // Rows zero through two retain the source quartet.
            // The fourth row consumes it directly.
            finalRow
                ? []
                : [
                    OP_2OVER,
                    OP_2OVER
                ],

            finalRow
                ? ADDR_PAIR01_FINAL_ROW_TABLE - 1
                : ADDR_PAIR01_ROW_TABLE + 3,

            OP_ADD,
            OP_PICK,

            OP_ADD,
            OP_PICK,

            finalRow
                ? OP_1SUB
                : [],

            finalRow
                ? [
                    OP_FROMALTSTACK,
                    OP_FROMALTSTACK,
                    OP_FROMALTSTACK,
                    OP_2ROT
                ]
                : [
                    OP_ROT,
                    OP_ROT
                ],

            ADDR_PAIR23_ROW_TABLE +
                (
                    finalRow
                        ? 1
                        : 2
                ),

            OP_ADD,
            OP_PICK,

            finalRow
                ? OP_1SUB
                : [],

            OP_ADD,
            OP_PICK,

            // Bring pair12 across the three restored outputs for
            // the final XOR.
            finalRow
                ? [
                    4,
                    OP_ROLL
                ]
                : [],

            OP_ADD,
            OP_PICK,

            finalRow
                ? []
                : OP_TOALTSTACK
        )

        orientation = targetOrientation
    }

    ENV = cloneEnv(plan.env)

    return emitted
}

const prince_m_layer = (
    pre_action = null
) => {
    const rows = [
        {
            base: 0,
            useMHat0: true
        },

        {
            base: 4,
            useMHat0: false
        },

        {
            base: 8,
            useMHat0: false
        },

        {
            base: 12,
            useMHat0: true
        }
    ]

    let bestGroupPerm = null
    let bestGroupCost = Infinity

    for (const groupPerm of PERMS_4) {
        let simEnv = cloneEnv(ENV)
        let totalCost = 0

        for (const groupIndex of groupPerm) {
            const row = rows[groupIndex]

            const stateIndices = loop(
                4,
                j =>
                    15 -
                    (row.base + j)
            )

            const plan = bestPairGroupForEnv(
                simEnv,
                stateIndices,
                row.useMHat0
                    ? 0
                    : 1
            )

            totalCost += plan.cost
            simEnv = plan.env
        }

        if (totalCost < bestGroupCost) {
            bestGroupCost = totalCost
            bestGroupPerm = [...groupPerm]
        }
    }

    return bestGroupPerm.map(
        groupIndex =>
            prince_MHatMultiply(
                rows[groupIndex].base,
                rows[groupIndex].useMHat0,
                pre_action
            )
    )
}

const prince_shiftRow = inverse => {
    const source = {}

    for (
        let i = 0;
        i < SIZE_STATE;
        i++
    ) {
        source[STATE(i)] =
            ENV[STATE(i)]
    }

    if (inverse) {
        PRINCE_SHIFT_INVERSE.forEach(
            (sourceIndex, destinationIndex) => {
                ENV[
                    STATE(15 - destinationIndex)
                ] =
                    source[
                        STATE(15 - sourceIndex)
                    ]
            }
        )
    } else {
        PRINCE_SHIFT.forEach(
            (sourceIndex, destinationIndex) => {
                ENV[
                    STATE(15 - destinationIndex)
                ] =
                    source[
                        STATE(15 - sourceIndex)
                    ]
            }
        )
    }
}

const op_load_key = () =>
    loop(SIZE_KEY, i => {
        if (i === 0) {
            return [
                OP_FROMALTSTACK,
                OP_PICK
            ]
        }

        if (i === 1) {
            return [
                OP_FROMALTSTACK,
                OP_1ADD,
                OP_PICK
            ]
        }

        return [
            OP_FROMALTSTACK,
            i,
            OP_ADD,
            OP_PICK
        ]
    })

const op_load_msg = () =>
    loop(
        SIZE_STATE,
        _ => OP_FROMALTSTACK
    )

const init_memory = [
    loop(
        SIZE_KEY + SIZE_STATE,
        _ => OP_TOALTSTACK
    ),

    push_tables_cold(),
    op_load_key(),
    push_tables_hot(),
    op_load_msg(),
    init_pointers()
]

const princev2_encrypt = [
    init_memory,

    // Initial whitening, forward S-box, and first M-layer.
    prince_m_layer(idx => [
        op_copy_key_to_top(idx),
        op_xor_shifted(),
        op_sbox()
    ]),

    prince_shiftRow(false),

    // Forward rounds 2–5.
    loop(4, i => {
        const round = i + 2

        return [
            prince_m_layer(idx => [
                op_copy_key_to_top(
                    (round - 1) % 2
                        ? idx + 16
                        : idx
                ),

                op_xor_shifted(),

                op_sbox_xor_constant(
                    RC[round - 1][idx]
                )
            ]),

            prince_shiftRow(false)
        ]
    }),

    // Middle forward section.
    prince_m_layer(idx => [
        op_copy_key_to_top(
            5 % 2
                ? idx + 16
                : idx
        ),

        op_xor_shifted(),

        op_sbox_xor_constant(
            RC[5][idx]
        ),

        op_copy_key_to_top(idx),
        op_xor_shifted()
    ]),

    prince_shiftRow(true),

    // Middle inverse section.
    prince_m_layer(idx_after => {
        const idx_before =
            15 -
            PRINCE_SHIFT_INVERSE[
                15 - idx_after
            ]

        return [
            op_copy_key_to_top(
                idx_before + 16
            ),

            op_xor_shifted(),

            op_xor_constant(
                BETA[idx_before]
            ),

            op_sbox_inv_xor_constant(
                RC[6][idx_before]
            ),

            op_copy_key_to_top(
                idx_before
            ),

            op_xor_shifted()
        ]
    }),

    // Inverse rounds 7–10.
    loop(4, i => {
        const round = i + 7

        return [
            prince_shiftRow(true),

            prince_m_layer(idx_after => {
                const idx_before =
                    15 -
                    PRINCE_SHIFT_INVERSE[
                        15 - idx_after
                    ]

                return [
                    op_sbox_inv_xor_constant(
                        RC[round][idx_before]
                    ),

                    op_copy_key_to_top(
                        round % 2
                            ? idx_before + 16
                            : idx_before
                    ),

                    op_xor_shifted()
                ]
            })
        ]
    }),

    // Final inverse S-box, beta, and key whitening.
    loop(SIZE_STATE, i => {
        const idx =
            SIZE_STATE -
            1 -
            i

        return [
            op_move_state_to_top(idx),

            op_sbox_inv_xor_constant(
                BETA[idx],
                0
            ),

            op_copy_key_to_top(
                idx + SIZE_STATE
            ),

            op_xor_shifted(0)
        ]
    }),

    loop(
        SIZE_STATE,
        _ => OP_TOALTSTACK
    ),

    drop_tables,

    loop(
        SIZE_STATE,
        _ => OP_FROMALTSTACK
    )
]

// Test cases
const test_case_1 = _ => {
    const push_dummy_key =
        loop(SIZE_KEY, _ => 0)

    const push_dummy_msg =
        loop(SIZE_STATE, _ => 0)

    return [
        push_dummy_key,
        push_dummy_msg,
        princev2_encrypt,
        console.table(window.STATS)
    ]
}

const test_case_2 = _ => {
    const KEY1 =
        split_into_nibbles(
            0x0123456789abcdefn
        )

    const KEY0 =
        split_into_nibbles(
            0xfedcba9876543210n
        )

    const PLAINTEXT =
        split_into_nibbles(
            0x0123456789abcdefn
        )

    const CYPHERTEXT =
        split_into_nibbles(
            0x603cd95fa72a8704n
        )

    return [
        [
            KEY0.reverse(),
            KEY1.reverse()
        ],

        PLAINTEXT.reverse(),
        princev2_encrypt,
        console.table(window.STATS)
    ]
}

// Run test
/* >>> DON'T REMOVE THIS COMMENT! <<< */
test_case_2()

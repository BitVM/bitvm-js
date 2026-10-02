// Regression test for the catch-up block-height bug in bitvm/listen.js.
//
// startListening() replays every block between the last processed height and the
// current chain tip. The old code passed the *current chain tip* as `block.height`
// for EVERY replayed block, so a 3-block catch-up (e.g. 100 -> 103) reported
// height 103 for blocks 101, 102 and 103 alike. That corrupted `utxoAge` computed
// in BitVMClient.listen() as `block.height - utxo.blockHeight`.
//
// This test asserts that each replayed block reports its own height.
//
// Run with:  node test/client-catchup-test.js

import { catchUp } from '../bitvm/listen.js'

let failures = 0
function assert(cond, msg) {
	if (cond) {
		console.log('  PASS: ' + msg)
	} else {
		console.error('  FAIL: ' + msg)
		failures++
	}
}

async function testCatchUpReportsEachBlockHeight() {
	// Simulate being 3 blocks behind: chain tip is 103, we start at 100.
	const latestHeight = 103
	const seen = []
	const mockEsplora = {
		fetchLatestBlockHeight: async () => latestHeight,
		fetchBlockAtHeight: async (h) => `hash-at-${h}`,
		fetchTXIDsInBlock: async (hash) => {
			const h = Number(hash.split('hash-at-')[1])
			return [`tx-in-${h}`]
		},
	}

	const end = await catchUp(
		async (block) => { seen.push(block.height) },
		mockEsplora,
		100,
	)

	assert(
		JSON.stringify(seen) === JSON.stringify([101, 102, 103]),
		`catch-up from 100 -> 103 reports each block height [101,102,103] (got ${JSON.stringify(seen)})`,
	)
	assert(end === 103, `catchUp returns the updated prevHeight 103 (got ${end})`)
}

console.log('client catch-up block-height test')
await testCatchUpReportsEachBlockHeight()

if (failures > 0) {
	console.error(`\n${failures} test(s) failed`)
	process.exit(1)
} else {
	console.log('\nAll tests passed')
}

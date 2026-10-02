import * as Esplora from '../libs/esplora.js'

// Replay every block between `prevHeight` (exclusive) and the current chain tip
// (inclusive), invoking `onBlock` once per block. Returns the updated prevHeight
// so the caller can resume from where it left off.
//
// IMPORTANT: `onBlock` is called with the height of the *block being processed*
// (`currentHeight`), NOT the current chain tip. Passing the tip height for every
// replayed block corrupts downstream logic such as
// `utxoAge = block.height - utxo.blockHeight` in BitVMClient.listen().
export async function catchUp(onBlock, esplora, prevHeight) {
	const latestHeight = await esplora.fetchLatestBlockHeight()
	while (prevHeight < latestHeight) {
		const currentHeight = prevHeight + 1
		const blockHash = await esplora.fetchBlockAtHeight(currentHeight)
		console.log(`new chain tip: ${blockHash}`)
		const txids = await esplora.fetchTXIDsInBlock(blockHash)
		await onBlock({ txids, height: currentHeight })
		prevHeight = currentHeight
	}
	return prevHeight
}

export async function startListening(onBlock, esplora = Esplora) {
	let prevHeight = await esplora.fetchLatestBlockHeight() - 3
	console.log(`Started listening at height ${prevHeight}`)
	setInterval(async _ => {
		prevHeight = await catchUp(onBlock, esplora, prevHeight)
	}, 15000)
}

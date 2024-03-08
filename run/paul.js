
import { program, data } from './dummy-program.js'
import { fetchUnspentOutputs } from '../libs/esplora.js'
import { createPaulClient } from '../bitvm/client.js'

const PAUL_SECRET = 'd898098e09898a0980989b980809809809f09809884324874302975287524398'

console.log('Trying to fetch an output...')
const fundingAddress = 'tb1pc23eejagwy5vjlshj6ukp762cj9ljt4nefy8mcx2w2482w7d0vmqswmwwn'
const outpoint = (await fetchUnspentOutputs( fundingAddress )).filter(utxo => utxo.value == 1_000_000)[0]
if(!outpoint)
	throw `Go to https://faucet.mutinynet.com and charge the contract with 1'000'000 sats! \n ${fundingAddress}`

const client = await createPaulClient(PAUL_SECRET, outpoint, program, data)

client.listen()


use std::collections::HashMap;
use std::str::FromStr;

use bitcoin::hashes::{ripemd160, Hash};
use bitcoin::Address;
use bitcoin::key::{Keypair, Secp256k1};

const DELIMITER: char = '=';

fn hash(bytes: &[u8]) -> [u8; 20] {
    ripemd160::Hash::hash(bytes).to_byte_array()
}

fn hash_id(identifier: &str, index: Option<u32>, value: u32) -> String {
    // TODO ensure there is no DELIMITER in identifier or index
    match index {
        None => format!("{identifier}{value}"),
        Some(index) => format!("{identifier}{index}{value}")
    }
}

fn to_commitment_id(identifier: &str, index: Option<u32>) -> String {
    match index {
        None => format!("{identifier}"),
        Some(index) => format!("{identifier}{index}")
    }
}

fn parse_hash_id(hash_id: &str) -> (&str, &str) {
    let split_vec : Vec<&str> = hash_id.splitn(2, DELIMITER).collect();
    (split_vec[0], split_vec[1])
}

trait Actor {
    fn script_pub_key() -> Address {
        // TODO: Implement properly
        eprintln!("Hardcoded winner address!");
        Address::from_str("tb1p9evrt83ma6e2jjc9ajagl2h0kqtz5y05nutg2xt2tn9xjcm29t0slwpyc9").unwrap().require_network(bitcoin::Network::Testnet).unwrap()
    }
}

struct Player<'a> {
    // TODO: Might have to write a helper function to get the secret
    // https://docs.rs/bitcoin/latest/bitcoin/key/struct.Keypair.html
    keypair: Keypair,
    hashes: HashMap<String, String>,
    opponent: &'a Opponent,
}

impl Actor for Player<'_>{}
impl<'a> Player<'a> {
    fn new(secret: &str, opponent: &'a Opponent) -> Self {
        let secp = Secp256k1::new();
        Self{
            keypair: Keypair::from_seckey_str(&secp, secret).unwrap(),
            hashes: HashMap::new(),
            opponent,
        }
    }
}

struct Opponent {
    id_to_hash: HashMap<String, String>,
    hash_to_id: HashMap<String, String>,
    preimages: HashMap<String, String>,
    commitments: HashMap<String, String>
}

impl Actor for Opponent{}
impl Opponent {
    fn new() -> Self {
        Self{
            id_to_hash: HashMap::new(),
            hash_to_id: HashMap::new(),
            preimages: HashMap::new(),
            commitments: HashMap::new(),
        }
    }
    // TODO add a function to provide initial hashes
}

// TODO put these into the model for bitvm
//impl VickyActor for VickyPlayer{}
//impl VickyActor for VickyOpponent{}
//trait VickyActor {
//
//}
//
//trait PaulActor {
//
//
//}



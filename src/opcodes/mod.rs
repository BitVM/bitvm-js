use bitcoin_script::define_pushable;

pub mod pseudo;
pub mod u32_zip;
pub mod u32_xor;

define_pushable!();


pub fn unroll<F, T>(count: u32, closure: F) -> Vec<T>
where
    F: Fn(u32) -> T,
    T: pushable::Pushable,
{
    let mut result = vec![];

    for i in 0..=count {
        result.push(closure(i))
    }
    result
}

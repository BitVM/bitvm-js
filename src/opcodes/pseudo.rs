use super::pushable::{self, Pushable};

pub fn unroll<F, T>(count: u32, closure: F) -> Vec<T>
where
    F: Fn(u32) -> T,
    T: Pushable,
{
    let mut result = vec![];

    for i in 0..=count {
        result.push(closure(i))
    }
    result
}

use ethabi::decode;
use ethabi::param_type::{ParamType, Reader};
use hex_literal::hex;

//this code is here to demonstrate function parameter decoding with a prefixed tuple code
fn main() {
    let types: &str = "(address[],uint[],uint,bytes32[],bytes)";
    let param_types_str = Reader::read(&types).unwrap(); //or_else(|e| Err(anyhow::anyhow!("Failed to read types: {}", e)));
    let param_types_def = ParamType::Tuple(vec![
        Box::new(ParamType::Array(Box::new(ParamType::Address))),
        Box::new(ParamType::Array(Box::new(ParamType::Uint(256)))),
        Box::new(ParamType::Uint(256)),
        Box::new(ParamType::Array(Box::new(ParamType::FixedBytes(32)))),
        Box::new(ParamType::Bytes),
    ]);

    println!("type(str): {:?}", param_types_str);
    println!("type(def): {:?}", param_types_def);

    let encoded = hex!(
        "

        0000000000000000000000000000000000000000000000000000000000000020 
        
        00000000000000000000000000000000000000000000000000000000000000a0
        00000000000000000000000000000000000000000000000000000000000000e0
        0000000000000000000000000000000000000000000000000000000000000001
        0000000000000000000000000000000000000000000000000000000000000120
        0000000000000000000000000000000000000000000000000000000000000140
        0000000000000000000000000000000000000000000000000000000000000001
        000000000000000000000000f36e7bc1dae85ed18cd492f9e856acf2bd13398e
        0000000000000000000000000000000000000000000000000000000000000001
        0000000000000000000000000000000000000000000000000000000000000001
        0000000000000000000000000000000000000000000000000000000000000000
        0000000000000000000000000000000000000000000000000000000000000000
        "
    );

    let res_str = decode(&[param_types_str], &encoded).unwrap();
    println!("decoded(str): {:?}", res_str);

    let res_def = decode(&[param_types_def], &encoded).unwrap();
    println!("decoded(def): {:?}", res_def);
}

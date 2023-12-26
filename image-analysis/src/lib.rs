//see https://linzichun.com/posts/wasm-rust-image-processing-in-webpages/
mod utils;

use image::{DynamicImage, ImageFormat, ImageBuffer, Rgba, Rgb};
use js_sys::{Uint8Array, Reflect, WebAssembly};
use wasm_bindgen::prelude::*;
use palette_extract::{get_palette_rgb, Color};
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]  // this macro is required for wasm-bindgen to work, must be added to the top of the file
extern "C" {
    // to call `console.log()` of js in rust, for debugging
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, image-analysis!");
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
  return a + b;
}


#[wasm_bindgen(js_name = "Color")]
#[derive(Serialize, Deserialize)]
pub struct RgbTuple {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}


#[wasm_bindgen]
pub fn load_image_from_uint8_array(_array: &[u8]) -> JsValue  {
    
//pub fn load_image_from_uint8_array(data: Uint8Array, width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    // let mut buffer = Vec::new();
    // data.for_each(|byte, _| buffer.push(byte));
    // let dynamic_image = DynamicImage::from_rawbuffer(width, height, buffer)?;
    let dynamic_image: DynamicImage = image::load_from_memory(_array).unwrap();

    // let dynamic_image: DynamicImage  = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, _array.to_vec())
    //     .map(DynamicImage::ImageRgba8)
    //     .expect("Failed to create image from raw data");

    // You can now process the image or return the raw RGB data
    let rgb_data: Vec<u8>= dynamic_image.to_rgb8().into_raw();
    let sum: u64 = rgb_data.iter().map(|&x| x as u64).sum();
    let formatted_number = sum.to_string();
    log(format!("sum {} width {} height {}", formatted_number, dynamic_image.width(), dynamic_image.height()).as_str());
    
    let colors = get_palette_rgb(&rgb_data);

    let tuples: Vec<RgbTuple> = colors.into_iter().map(|c| RgbTuple {
        r: c.r,
        g: c.g,
        b: c.b
    }).collect();
    
    // colors

    // let buffer = wasm_bindgen::memory()
    // .dyn_into::<WebAssembly::Memory>()?
    // .buffer();
    // let uint8_array = Uint8Array::new_with_byte_offset(&buffer, 0);
    
    // Ok(ReturnObject::new(uint8_array,  dynamic_image.width(), dynamic_image.height()))
    serde_wasm_bindgen::to_value(&tuples).unwrap()
 
}


// #[wasm_bindgen]
// pub fn load_image_from_buffer(buffer: Vec<u8>) -> Result<Vec<u8>, JsValue> {
//     let dynamic_image = image::load_from_memory(&buffer)?;

//     // You can now process the image or return the raw RGB data
//     let rgb_data = dynamic_image.to_rgb8().into_raw();

//     Ok(rgb_data)
// }
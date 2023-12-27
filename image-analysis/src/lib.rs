//see https://linzichun.com/posts/wasm-rust-image-processing-in-webpages/
mod utils;

use image::DynamicImage;
use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use kmeans_colors::{get_kmeans, Kmeans, Sort};
use palette::cast::from_component_slice;
use palette::{FromColor, IntoColor, Lab, Srgb};

/// to call `console.log()` of js in rust, for debugging
#[wasm_bindgen] 
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(js_name = "Color")]
#[derive(Serialize, Deserialize)]
pub struct HistogramEntry {
    pub freq: f32,
    #[wasm_bindgen(getter_with_clone)]
    pub hex: String,
    #[wasm_bindgen(getter_with_clone)]
    pub rgb: Box<[u8]>,
}

/// extracts k dominant colors from an image
/// 
/// # Arguments
/// 
/// * `array`   - the encoded image data (eg a JPG file)
/// * `runs`    - the number of times to run the kmeans algorithm with different seeds. 2 should be good
/// * `k`       - the number of colors to extract. 10 is what most people need
/// * `max_iter`- the maximum number of iterations to run the kmeans algorithm. 20 seems to be good
/// 
/// https://docs.rs/kmeans_colors/latest/kmeans_colors
/// https://github.com/okaneco/kmeans-colors/issues/48
#[wasm_bindgen]
pub async fn get_dominant_colors(_array: &[u8], runs: usize, k: usize, max_iter: usize) -> JsValue {
    //let promise = js_sys::Promise::resolve(&42.into());
    
        let dynamic_image: DynamicImage = image::load_from_memory(&_array).unwrap();
        let scaled = dynamic_image.resize(500,500, FilterType::Nearest);
        let rgb_data: Vec<u8> = scaled.to_rgb8().into_raw();

        let lab: Vec<Lab> = from_component_slice::<Srgb<u8>>(&rgb_data)
            .iter()
            .map(|x| x.into_format().into_color())
            .collect();

        let mut result = Kmeans::new();
        
        let convergence_factor = 10.0;
        let verbose = false;
        let seed = 314;

        for i in 0..runs {
            let run_result = get_kmeans(
                k,
                max_iter,
                convergence_factor,
                verbose,
                &lab,
                seed + i as u64,
            );
            if run_result.score < result.score {
                result = run_result;
            }
        }

        let mut res = Lab::sort_indexed_colors(&result.centroids, &result.indices);

        //sort results by percentage
        res.sort_unstable_by(|a, b| (b.percentage).total_cmp(&a.percentage));

        let rgb = &res
            .iter()
            .map(|x| {
                let col = Srgb::from_color(x.centroid).into_format();
                HistogramEntry {
                    freq: x.percentage, 
                    rgb: Box::new([col.red, col.green, col.blue]),
                    hex: format!("#{:02x}{:02x}{:02x}", col.red, col.green, col.blue),
                }
            })
            .collect::<Vec<HistogramEntry>>();

        serde_wasm_bindgen::to_value(&rgb).unwrap()

}

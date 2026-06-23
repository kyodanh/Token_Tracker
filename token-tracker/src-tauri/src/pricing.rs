pub struct TokenPrice {
    pub input_per_million: f64,
    pub output_per_million: f64,
    /// cache write = 1.25× input
    pub cache_write_per_million: f64,
    /// cache read = 0.10× input
    pub cache_read_per_million: f64,
}

pub fn model_price(model: &str) -> TokenPrice {
    if model.contains("claude-opus") {
        TokenPrice { input_per_million: 15.0, output_per_million: 75.0, cache_write_per_million: 18.75, cache_read_per_million: 1.50 }
    } else if model.contains("claude-sonnet") {
        TokenPrice { input_per_million: 3.0, output_per_million: 15.0, cache_write_per_million: 3.75, cache_read_per_million: 0.30 }
    } else if model.contains("claude-haiku") {
        TokenPrice { input_per_million: 0.25, output_per_million: 1.25, cache_write_per_million: 0.30, cache_read_per_million: 0.03 }
    } else if model.contains("gpt-4o") {
        TokenPrice { input_per_million: 2.5, output_per_million: 10.0, cache_write_per_million: 0.0, cache_read_per_million: 1.25 }
    } else if model.contains("gpt-4") {
        TokenPrice { input_per_million: 30.0, output_per_million: 60.0, cache_write_per_million: 0.0, cache_read_per_million: 0.0 }
    } else if model.contains("gpt-3.5") {
        TokenPrice { input_per_million: 0.5, output_per_million: 1.5, cache_write_per_million: 0.0, cache_read_per_million: 0.0 }
    } else {
        TokenPrice { input_per_million: 3.0, output_per_million: 15.0, cache_write_per_million: 3.75, cache_read_per_million: 0.30 }
    }
}

pub fn calculate_cost(model: &str, input_tokens: i64, output_tokens: i64) -> f64 {
    calculate_cost_with_cache(model, input_tokens, output_tokens, 0, 0)
}

pub fn calculate_cost_with_cache(
    model: &str,
    input_tokens: i64,
    output_tokens: i64,
    cache_write_tokens: i64,
    cache_read_tokens: i64,
) -> f64 {
    let p = model_price(model);
    let m = 1_000_000.0_f64;
    (input_tokens as f64 / m) * p.input_per_million
        + (output_tokens as f64 / m) * p.output_per_million
        + (cache_write_tokens as f64 / m) * p.cache_write_per_million
        + (cache_read_tokens as f64 / m) * p.cache_read_per_million
}

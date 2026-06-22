pub struct TokenPrice {
    pub input_per_million: f64,
    pub output_per_million: f64,
}

pub fn model_price(model: &str) -> TokenPrice {
    if model.contains("claude-opus") {
        TokenPrice { input_per_million: 15.0, output_per_million: 75.0 }
    } else if model.contains("claude-sonnet") {
        TokenPrice { input_per_million: 3.0, output_per_million: 15.0 }
    } else if model.contains("claude-haiku") {
        TokenPrice { input_per_million: 0.25, output_per_million: 1.25 }
    } else if model.contains("gpt-4o") {
        TokenPrice { input_per_million: 2.5, output_per_million: 10.0 }
    } else if model.contains("gpt-4") {
        TokenPrice { input_per_million: 30.0, output_per_million: 60.0 }
    } else if model.contains("gpt-3.5") {
        TokenPrice { input_per_million: 0.5, output_per_million: 1.5 }
    } else {
        TokenPrice { input_per_million: 3.0, output_per_million: 15.0 }
    }
}

pub fn calculate_cost(model: &str, input_tokens: i64, output_tokens: i64) -> f64 {
    let price = model_price(model);
    (input_tokens as f64 / 1_000_000.0) * price.input_per_million
        + (output_tokens as f64 / 1_000_000.0) * price.output_per_million
}

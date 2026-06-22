pub mod claude_web;
pub mod claude_code;
pub mod openai;
pub mod openrouter;
pub mod chatgpt_web;

use anyhow::Result;
use crate::models::NewSnapshot;

#[async_trait::async_trait]
pub trait Provider: Send + Sync {
    fn id(&self) -> &str;
    async fn fetch(&self, secret: &str) -> Result<NewSnapshot>;
}

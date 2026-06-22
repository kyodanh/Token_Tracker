use sqlx::{sqlite::SqlitePool, Pool, Sqlite};
use anyhow::Result;

pub type Db = Pool<Sqlite>;

pub async fn init() -> Result<Db> {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("TokenTracker");
    std::fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join("db.sqlite");
    let url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

    let pool = SqlitePool::connect(&url).await?;
    run_migrations(&pool).await?;
    Ok(pool)
}

async fn run_migrations(pool: &Db) -> Result<()> {
    sqlx::query(include_str!("../migrations/001_initial.sql"))
        .execute(pool)
        .await?;
    Ok(())
}

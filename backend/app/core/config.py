from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Market Opportunity Intelligence"
    debug: bool = True
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openbb_pat: str = ""
    use_mock_data: bool = True

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

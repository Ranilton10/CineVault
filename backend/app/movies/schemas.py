
from pydantic import BaseModel, Field


class MovieCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    director: str = Field(min_length=1, max_length=200)
    release_year: int = Field(ge=1888, le=2100)
    genres: list[str] = Field(min_length=1)
    synopsis: str = Field(min_length=1)
    duration: int | None = Field(default=None, gt=0)
    poster_url: str | None = None
    backdrop_url: str | None = None


class MovieUpdate(BaseModel):
    title: str | None = Field(
        default=None, min_length=1, max_length=500
    )
    director: str | None = Field(
        default=None, min_length=1, max_length=200
    )
    release_year: int | None = Field(
        default=None, ge=1888, le=2100
    )
    genres: list[str] | None = Field(
        default=None, min_length=1
    )
    synopsis: str | None = Field(
        default=None, min_length=1
    )
    duration: int | None = Field(
        default=None, gt=0
    )
    poster_url: str | None = None
    backdrop_url: str | None = None


class ReviewCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)



from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview
from app.movies.schemas import MovieCreate, MovieUpdate, ReviewCreate

router = APIRouter()


@router.get("/")
async def list_movies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    filters = []

    if search and search.strip():
        filters.append(
            DimMovie.titulo.ilike(f"%{search.strip()}%")
        )

    total = await db.scalar(
        select(func.count())
        .select_from(DimMovie)
        .where(*filters)
    )

    result = await db.execute(
        select(DimMovie)
        .where(*filters)
        .order_by(DimMovie.titulo, DimMovie.sk_movie_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    movies = result.scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "movies": [
            {
                "id": movie.sk_movie_id,
                "title": movie.titulo,
                "release_year": movie.ano_lancamento,
                "synopsis": movie.sinopse,
                "poster_url": movie.url_poster,
            }
            for movie in movies
        ],
    }


@router.get("/{movie_id}")
async def get_movie(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.reviews),
            selectinload(DimMovie.performance),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one_or_none()

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    reviews = [
        {
            "id": review.sk_movie_review_id,
            "name": review.nome,
            "rating": review.nota / 2,
            "comment": review.comentario,
            "created_at": review.created_at,
        }
        for review in movie.reviews
    ]

    average_rating = (
        round(
            sum(review["rating"] for review in reviews)
            / len(reviews),
            2,
        )
        if reviews
        else None
    )

    return {
        "id": movie.sk_movie_id,
        "title": movie.titulo,
        "release_date": movie.data_lancamento,
        "release_year": movie.ano_lancamento,
        "duration": movie.duracao_minutos,
        "status": movie.status_filme,
        "synopsis": movie.sinopse,
        "poster_url": movie.url_poster,
        "backdrop_url": movie.url_backdrop,
        "genres": [
            genre.nome_genero
            for genre in movie.genres
        ],
        "directors": [
            person.nome_pessoa
            for person in movie.people
            if person.tipo_pessoa == "Diretor"
        ],
        "cast": [
            person.nome_pessoa
            for person in movie.people
            if person.tipo_pessoa == "Ator"
        ],
        "companies": [
            company.nome_produtora
            for company in movie.companies
        ],
        "reviews": reviews,
        "average_rating": average_rating,
        "review_count": len(reviews),
    }


@router.post("/", status_code=201)
async def create_movie(
    data: MovieCreate,
    db: AsyncSession = Depends(get_db),
):
    genre_names = list(
        dict.fromkeys(
            name.strip()
            for name in data.genres
            if name.strip()
        )
    )

    if not genre_names:
        raise HTTPException(
            status_code=422,
            detail="Informe pelo menos um gênero válido.",
        )

    director_name = data.director.strip()

    if not director_name:
        raise HTTPException(
            status_code=422,
            detail="Informe um diretor válido.",
        )

    if not data.title.strip() or not data.synopsis.strip():
        raise HTTPException(
            status_code=422,
            detail="Título e sinopse são obrigatórios.",
        )

    movie = DimMovie(
        sk_movie_id=uuid4().hex,
        id_filme=f"cinevault-{uuid4().hex}",
        titulo=data.title.strip(),
        ano_lancamento=data.release_year,
        sinopse=data.synopsis.strip(),
        duracao_minutos=data.duration,
        url_poster=data.poster_url,
        url_backdrop=data.backdrop_url,
        status_filme="Lançado",
    )

    for name in genre_names:
        result = await db.execute(
            select(DimGenre).where(
                func.lower(DimGenre.nome_genero) == name.lower()
            )
        )

        genre = result.scalar_one_or_none()

        if genre is None:
            genre = DimGenre(
                sk_genre_id=uuid4().hex,
                nome_genero=name,
            )

        movie.genres.append(genre)

    result = await db.execute(
        select(DimPerson).where(
            DimPerson.nome_pessoa == director_name,
            DimPerson.tipo_pessoa == "Diretor",
        )
    )

    director = result.scalar_one_or_none()

    if director is None:
        director = DimPerson(
            sk_person_id=uuid4().hex,
            nome_pessoa=director_name,
            tipo_pessoa="Diretor",
        )

    movie.people.append(director)

    db.add(movie)
    await db.commit()

    return {
        "id": movie.sk_movie_id,
        "message": "Filme cadastrado com sucesso.",
    }


@router.patch("/{movie_id}")
async def update_movie(
    movie_id: str,
    data: MovieUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one_or_none()

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    changes = data.model_dump(exclude_unset=True)

    if "title" in changes:
        if not changes["title"] or not changes["title"].strip():
            raise HTTPException(
                status_code=422,
                detail="Título inválido",
            )

        movie.titulo = changes["title"].strip()

    if "synopsis" in changes:
        if not changes["synopsis"] or not changes["synopsis"].strip():
            raise HTTPException(
                status_code=422,
                detail="Sinopse inválida",
            )

        movie.sinopse = changes["synopsis"].strip()

    if "release_year" in changes:
        movie.ano_lancamento = changes["release_year"]

    if "duration" in changes:
        movie.duracao_minutos = changes["duration"]

    if "poster_url" in changes:
        movie.url_poster = changes["poster_url"]

    if "backdrop_url" in changes:
        movie.url_backdrop = changes["backdrop_url"]

    if "genres" in changes:
        if changes["genres"] is None:
            raise HTTPException(
                status_code=422,
                detail="Informe gêneros válidos",
            )

        names = list(
            dict.fromkeys(
                name.strip()
                for name in changes["genres"]
                if name.strip()
            )
        )

        if not names:
            raise HTTPException(
                status_code=422,
                detail="Informe gêneros válidos",
            )

        genres = []

        for name in names:
            result = await db.execute(
                select(DimGenre).where(
                    func.lower(DimGenre.nome_genero) == name.lower()
                )
            )

            genre = result.scalar_one_or_none()

            if genre is None:
                genre = DimGenre(
                    sk_genre_id=uuid4().hex,
                    nome_genero=name,
                )

            genres.append(genre)

        movie.genres = genres

    if "director" in changes:
        name = changes["director"]

        if not name or not name.strip():
            raise HTTPException(
                status_code=422,
                detail="Diretor inválido",
            )

        name = name.strip()

        result = await db.execute(
            select(DimPerson).where(
                DimPerson.nome_pessoa == name,
                DimPerson.tipo_pessoa == "Diretor",
            )
        )

        director = result.scalar_one_or_none()

        if director is None:
            director = DimPerson(
                sk_person_id=uuid4().hex,
                nome_pessoa=name,
                tipo_pessoa="Diretor",
            )

        movie.people = [
            person
            for person in movie.people
            if person.tipo_pessoa != "Diretor"
        ] + [director]

    await db.commit()

    return {
        "id": movie.sk_movie_id,
        "message": "Filme atualizado com sucesso.",
    }


@router.delete("/{movie_id}", status_code=204)
async def delete_movie(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.reviews),
            selectinload(DimMovie.performance),
            selectinload(DimMovie.reviews_summary),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one_or_none()

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    await db.delete(movie)
    await db.commit()


@router.post("/{movie_id}/reviews", status_code=201)
async def create_review(
    movie_id: str,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    if not data.name.strip() or not data.comment.strip():
        raise HTTPException(
            status_code=422,
            detail="Nome e comentário são obrigatórios.",
        )

    review = MovieReview(
        sk_movie_review_id=uuid4().hex,
        sk_movie_id=movie_id,
        nome=data.name.strip(),
        nota=data.rating * 2,
        comentario=data.comment.strip(),
    )

    db.add(review)
    await db.commit()

    return {
        "id": review.sk_movie_review_id,
        "movie_id": movie_id,
        "name": review.nome,
        "rating": data.rating,
        "comment": review.comentario,
        "message": "Avaliação cadastrada com sucesso.",
    }


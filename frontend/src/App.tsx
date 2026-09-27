
import { useEffect, useState } from 'react'
import MovieDetails from './MovieDetails'
import MovieForm from './MovieForm'
import './App.css'

type Movie = {
  id: string
  title: string
  release_year: number | null
  synopsis: string | null
  poster_url: string | null
}

type MovieResponse = {
  page: number
  page_size: number
  total: number
  movies: Movie[]
}

const PAGE_SIZE = 12

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null)
  const [showMovieForm, setShowMovieForm] = useState(false)
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMovies() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/v1/movies/?page=${page}&page_size=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Não foi possível carregar os filmes.')
        }

        const data: MovieResponse = await response.json()

        if (!controller.signal.aborted) {
          setMovies(data.movies)
          setTotal(data.total)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Erro ao carregar o catálogo.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    const timer = window.setTimeout(loadMovies, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [search, page, refreshKey])

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changePage(nextPage: number) {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openMovie(movieId: string) {
    setSelectedMovieId(movieId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeMovie() {
    setSelectedMovieId(null)
  }

  function handleMovieCreated() {
    setShowMovieForm(false)
    setSearch('')
    setPage(1)
    setRefreshKey((current) => current + 1)
  }

  function handleMovieUpdated() {
    setEditingMovieId(null)
    setSelectedMovieId(null)
    setSearch('')
    setPage(1)
    setRefreshKey((current) => current + 1)
  }

  function handleMovieDeleted() {
    setSelectedMovieId(null)
    setEditingMovieId(null)
    setSearch('')
    setPage(1)
    setRefreshKey((current) => current + 1)
  }

  return (
    <div className="app">
      <header>
        <h1>🎬 CineVault</h1>
        <p>Seu catálogo de filmes</p>
      </header>

      <main>
        {showMovieForm ? (
          <MovieForm
            onBack={() => setShowMovieForm(false)}
            onCreated={handleMovieCreated}
          />
        ) : editingMovieId ? (
          <MovieForm
            movieId={editingMovieId}
            onBack={() => setEditingMovieId(null)}
            onCreated={handleMovieUpdated}
          />
        ) : selectedMovieId ? (
          <MovieDetails
            movieId={selectedMovieId}
            onBack={closeMovie}
            onEdit={() => setEditingMovieId(selectedMovieId)}
            onDeleted={handleMovieDeleted}
          />
        ) : (
          <>
            <div className="catalog-header">
              <h2>Explore nosso catálogo</h2>

              <button
                type="button"
                className="create-movie-button"
                onClick={() => setShowMovieForm(true)}
              >
                + Cadastrar filme
              </button>
            </div>

            <input
              type="search"
              placeholder="Pesquisar filmes..."
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              className="search-input"
            />

            {loading && <p>Carregando filmes...</p>}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {!loading && !error && movies.length === 0 && (
              <p>Nenhum filme encontrado.</p>
            )}

            {!loading && !error && (
              <>
                <p className="results-count">
                  {total.toLocaleString('pt-BR')} filmes encontrados
                </p>

                <div className="movie-grid">
                  {movies.map((movie) => (
                    <article className="movie-card" key={movie.id}>
                      <button
                        type="button"
                        className="movie-card-button"
                        onClick={() => openMovie(movie.id)}
                        aria-label={`Ver detalhes de ${movie.title}`}
                      >
                        <div className="poster-container">
                          {movie.poster_url ? (
                            <img
                              src={movie.poster_url}
                              alt={`Pôster de ${movie.title}`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="poster-placeholder">
                              <span>🎬</span>
                              <p>Sem pôster</p>
                            </div>
                          )}
                        </div>

                        <div className="movie-info">
                          <h3>{movie.title}</h3>
                          <p>
                            {movie.release_year ?? 'Ano desconhecido'}
                          </p>
                        </div>
                      </button>
                    </article>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="pagination" aria-label="Paginação">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => changePage(page - 1)}
                    >
                      Anterior
                    </button>

                    <span>
                      Página {page} de {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => changePage(page + 1)}
                    >
                      Próxima
                    </button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App


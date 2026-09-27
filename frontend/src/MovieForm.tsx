
import { useEffect, useState, type FormEvent } from 'react'

type MovieData = {
  title: string
  release_year: number | null
  duration: number | null
  synopsis: string | null
  poster_url: string | null
  backdrop_url: string | null
  genres: string[]
  directors: string[]
}

type Props = {
  onBack: () => void
  onCreated: () => void
  movieId?: string
}

function MovieForm({ onBack, onCreated, movieId }: Props) {
  const [title, setTitle] = useState('')
  const [director, setDirector] = useState('')
  const [releaseYear, setReleaseYear] = useState('')
  const [genres, setGenres] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [duration, setDuration] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [backdropUrl, setBackdropUrl] = useState('')
  const [loading, setLoading] = useState(Boolean(movieId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!movieId) return

    const controller = new AbortController()

    async function loadMovie() {
      try {
        const response = await fetch(
          `/api/v1/movies/${encodeURIComponent(movieId!)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Erro ao carregar filme.')
        }

        const movie: MovieData = await response.json()

        if (controller.signal.aborted) return

        setTitle(movie.title)
        setDirector(movie.directors[0] ?? '')
        setReleaseYear(String(movie.release_year ?? ''))
        setGenres(movie.genres.join(', '))
        setSynopsis(movie.synopsis ?? '')
        setDuration(String(movie.duration ?? ''))
        setPosterUrl(movie.poster_url ?? '')
        setBackdropUrl(movie.backdrop_url ?? '')
      } catch {
        if (!controller.signal.aborted) {
          setError('Não foi possível carregar os dados do filme.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadMovie()

    return () => controller.abort()
  }, [movieId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const genreList = genres
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean)

    if (genreList.length === 0) {
      setError('Informe pelo menos um gênero.')
      setSaving(false)
      return
    }

    try {
      const payload = {
        title: title.trim(),
        director: director.trim(),
        release_year: Number(releaseYear),
        genres: genreList,
        synopsis: synopsis.trim(),
        duration: duration ? Number(duration) : null,
        poster_url: posterUrl.trim() || null,
        backdrop_url: backdropUrl.trim() || null,
      }

      const response = await fetch(
        movieId
          ? `/api/v1/movies/${encodeURIComponent(movieId)}`
          : '/api/v1/movies/',
        {
          method: movieId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao salvar filme.')
      }

      onCreated()
    } catch {
      setError('Não foi possível salvar o filme. Verifique os dados.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Carregando formulário...</p>
  }

  return (
    <section className="movie-form-page">
      <button type="button" onClick={onBack}>
        ← Voltar
      </button>

      <h2>{movieId ? 'Editar filme' : 'Cadastrar filme'}</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Título
          <input
            required
            maxLength={500}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          Diretor
          <input
            required
            maxLength={200}
            value={director}
            onChange={(event) => setDirector(event.target.value)}
          />
        </label>

        <label>
          Ano de lançamento
          <input
            required
            type="number"
            min="1888"
            max="2100"
            value={releaseYear}
            onChange={(event) => setReleaseYear(event.target.value)}
          />
        </label>

        <label>
          Gêneros separados por vírgula
          <input
            required
            value={genres}
            onChange={(event) => setGenres(event.target.value)}
          />
        </label>

        <label>
          Sinopse
          <textarea
            required
            rows={5}
            value={synopsis}
            onChange={(event) => setSynopsis(event.target.value)}
          />
        </label>

        <label>
          Duração em minutos
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </label>

        <label>
          URL do pôster
          <input
            type="url"
            value={posterUrl}
            onChange={(event) => setPosterUrl(event.target.value)}
          />
        </label>

        <label>
          URL da imagem de fundo
          <input
            type="url"
            value={backdropUrl}
            onChange={(event) => setBackdropUrl(event.target.value)}
          />
        </label>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving
            ? 'Salvando...'
            : movieId
              ? 'Salvar alterações'
              : 'Cadastrar filme'}
        </button>
      </form>
    </section>
  )
}

export default MovieForm


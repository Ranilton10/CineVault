
import { useEffect, useState } from 'react'
import ReviewForm from './ReviewForm'

type Review = {
  id: string
  name: string
  rating: number
  comment: string
  created_at: string
}

type MovieDetailsData = {
  id: string
  title: string
  release_year: number | null
  duration: number | null
  synopsis: string | null
  poster_url: string | null
  genres: string[]
  directors: string[]
  cast: string[]
  companies: string[]
  reviews: Review[]
  average_rating: number | null
  review_count: number
}

type Props = {
  movieId: string
  onBack: () => void
  onEdit: () => void
  onDeleted: () => void
}

function MovieDetails({
  movieId,
  onBack,
  onEdit,
  onDeleted,
}: Props) {
  const [movie, setMovie] = useState<MovieDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMovie() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/v1/movies/${encodeURIComponent(movieId)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Erro ao carregar filme.')
        }

        const data: MovieDetailsData = await response.json()

        if (!controller.signal.aborted) {
          setMovie(data)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Não foi possível carregar o filme.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadMovie()

    return () => controller.abort()
  }, [movieId, reviewRefreshKey])

  async function handleDelete() {
    if (!movie || deleting) return

    setDeleting(true)
    setError('')

    try {
      const response = await fetch(
        `/api/v1/movies/${encodeURIComponent(movieId)}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Erro ao excluir filme.')
      }

      onDeleted()
    } catch {
      setError('Não foi possível excluir o filme.')
      setShowDeleteConfirmation(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="movie-details">
      <div className="details-actions">
        <button type="button" onClick={onBack}>
          ← Voltar ao catálogo
        </button>

        {movie && (
          <>
            <button type="button" onClick={onEdit}>
              Editar filme
            </button>

            <button
              type="button"
              className="delete-movie-button"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              Excluir filme
            </button>
          </>
        )}
      </div>

      {loading && <p>Carregando detalhes...</p>}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {movie && (
        <>
          <h2>{movie.title}</h2>

          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={`Pôster de ${movie.title}`}
              width="220"
            />
          )}

          <p>
            Ano: {movie.release_year ?? 'Não informado'}
          </p>

          <p>
            Duração:{' '}
            {movie.duration !== null
              ? `${movie.duration} minutos`
              : 'Não informada'}
          </p>

          <p>
            Direção:{' '}
            {movie.directors.join(', ') || 'Não informada'}
          </p>

          <p>
            Gêneros:{' '}
            {movie.genres.join(', ') || 'Não informados'}
          </p>

          <p>
            Elenco:{' '}
            {movie.cast.join(', ') || 'Não informado'}
          </p>

          <p>
            Produtoras:{' '}
            {movie.companies.join(', ') || 'Não informadas'}
          </p>

          <h3>Sinopse</h3>

          <p>
            {movie.synopsis || 'Sinopse não disponível.'}
          </p>

          <ReviewForm
            movieId={movieId}
            onCreated={() =>
              setReviewRefreshKey((current) => current + 1)
            }
          />

          <h3>Avaliações</h3>

          <p>
            Média:{' '}
            {movie.average_rating !== null
              ? `${movie.average_rating.toFixed(2)} / 5`
              : 'Sem avaliações'}
          </p>

          <p>
            Total de avaliações: {movie.review_count}
          </p>

          {movie.reviews.length === 0 ? (
            <p>Este filme ainda não possui avaliações.</p>
          ) : (
            <div>
              {movie.reviews.map((review) => (
                <article key={review.id}>
                  <h4>{review.name}</h4>

                  <p>
                    Nota: {review.rating.toFixed(2)} / 5
                  </p>

                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {showDeleteConfirmation && movie && (
        <div
          className="delete-confirmation"
          role="alertdialog"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
        >
          <h3 id="delete-title">
            Confirmar exclusão
          </h3>

          <p id="delete-description">
            Deseja realmente excluir o filme "{movie.title}"?
            Essa ação não poderá ser desfeita.
          </p>

          <div className="delete-confirmation-actions">
            <button
              type="button"
              disabled={deleting}
              onClick={() =>
                setShowDeleteConfirmation(false)
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting
                ? 'Excluindo...'
                : 'Sim, excluir'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default MovieDetails


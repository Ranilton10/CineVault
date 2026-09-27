
import { useState, type FormEvent } from 'react'

type Props = {
  movieId: string
  onCreated: () => void
}

function ReviewForm({ movieId, onCreated }: Props) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe seu nome.')
      return
    }

    if (rating < 1 || rating > 5) {
      setError('Selecione uma nota de 1 a 5 estrelas.')
      return
    }

    if (!comment.trim()) {
      setError('Escreva um comentário.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `/api/v1/movies/${encodeURIComponent(movieId)}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            rating,
            comment: comment.trim(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Não foi possível cadastrar a avaliação.')
      }

      setName('')
      setRating(0)
      setComment('')
      onCreated()
    } catch {
      setError('Erro ao cadastrar a avaliação. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="review-form">
      <h3>Escrever uma avaliação</h3>

      <form onSubmit={handleSubmit}>
        <label htmlFor="review-name">Seu nome</label>

        <input
          id="review-name"
          type="text"
          required
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Digite seu nome"
        />

        <p>Sua nota</p>

        <div className="rating-stars" role="group" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={saving}
              onClick={() => setRating(star)}
              aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
              aria-pressed={rating === star}
              className={star <= rating ? 'selected' : ''}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>

        <p>
          {rating === 0
            ? 'Selecione uma nota'
            : `Nota selecionada: ${rating} de 5`}
        </p>

        <label htmlFor="review-comment">Comentário</label>

        <textarea
          id="review-comment"
          required
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="O que você achou do filme?"
        />

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Enviando...' : 'Publicar avaliação'}
        </button>
      </form>
    </section>
  )
}

export default ReviewForm


import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { StarIcon } from './icons'

interface FavoriteButtonProps {
  kind: 'problem' | 'template'
  id: string
}

export default function FavoriteButton({ kind, id }: FavoriteButtonProps) {
  const { user, isFavorite, toggleFavorite } = useAuth()
  const location = useLocation()
  const [busy, setBusy] = useState(false)

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname }}
        className="btn-secondary no-print"
        title="로그인 후 즐겨찾기할 수 있습니다"
      >
        <StarIcon className="h-4 w-4" />
        즐겨찾기
      </Link>
    )
  }

  const fav = isFavorite(kind, id)

  async function handleClick() {
    setBusy(true)
    try {
      await toggleFavorite(kind, id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`no-print ${fav ? 'btn-accent' : 'btn-secondary'}`}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={fav}
    >
      <StarIcon className="h-4 w-4" filled={fav} />
      {fav ? '즐겨찾기 해제' : '즐겨찾기'}
    </button>
  )
}

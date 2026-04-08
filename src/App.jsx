import { useEffect, useMemo, useState } from 'react'
import './App.css'

const imageFiles = [
  'alpine-silence.jpg',
  'AN_00761 (2025-07-10T21_57_58.814).jpg',
  'AN_00943 (2025-07-10T22_23_20.020).jpg',
  'AN_01030 (2025-07-10T23_18_29.032).jpg',
  'AN_01143 (2025-07-10T23_53_36.897).jpg',
  'desert-light.jpg',
  'moonlit-dunes.jpg',
  'quiet-forest.jpg',
  'river-geometry.jpg',
  'storm-over-ridge.jpg'
]

const titleCase = (value) => value
  .split(' ')
  .filter(Boolean)
  .map((word) => (word === word.toUpperCase() ? word : word[0].toUpperCase() + word.slice(1)))
  .join(' ')

const getTitleFromFilename = (filename) => {
  const stem = filename.replace(/\.[^.]+$/, '')
  const withoutTimestamp = stem.replace(/\s*\([^)]*\)/g, '')
  const cleaned = withoutTimestamp.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return titleCase(cleaned)
}

const getPlaceKey = (filename) => {
  const rawTitle = getTitleFromFilename(filename)
  const noTrailingNumber = rawTitle.replace(/\s\d+$/, '').trim()
  return noTrailingNumber || rawTitle
}

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const getCategoryFromFilename = (filename) => (/^AN_/i.test(filename) ? 'events' : 'wedding')

const getPlaceSlugFromHash = () => {
  const hash = window.location.hash
  if (!hash.startsWith('#place-')) {
    return null
  }
  return hash.replace('#place-', '').trim()
}

function App() {
  const places = useMemo(() => {
    const groupedMap = new Map()

    imageFiles.forEach((filename) => {
      const placeTitle = getPlaceKey(filename)
      const photoTitle = getTitleFromFilename(filename)
      const existingPlace = groupedMap.get(placeTitle)
      const imagePath = `/images/${filename}`

      if (!existingPlace) {
        groupedMap.set(placeTitle, {
          title: placeTitle,
          slug: slugify(placeTitle),
          category: getCategoryFromFilename(filename),
          coverImage: imagePath,
          photos: [
            {
              title: photoTitle,
              image: imagePath
            }
          ]
        })
        return
      }

      existingPlace.photos.push({
        title: photoTitle,
        image: imagePath
      })
    })

    return [...groupedMap.values()]
  }, [])

  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState(() => getPlaceSlugFromHash())
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [activePhotoIndex, setActivePhotoIndex] = useState(null)

  useEffect(() => {
    const onHashChange = () => {
      setSelectedPlaceSlug(getPlaceSlugFromHash())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectedPlace = places.find((place) => place.slug === selectedPlaceSlug) || null
  const selectedPlacePhotos = selectedPlace?.photos || []
  const activePhoto = activePhotoIndex === null ? null : selectedPlacePhotos[activePhotoIndex] || null
  const weddingPlaces = places.filter((place) => place.category === 'wedding')
  const eventPlaces = places.filter((place) => place.category === 'events')

  const closePhoto = () => {
    setActivePhotoIndex(null)
  }

  const showPreviousPhoto = () => {
    if (!selectedPlacePhotos.length || activePhotoIndex === null) {
      return
    }

    const previousIndex = (activePhotoIndex - 1 + selectedPlacePhotos.length) % selectedPlacePhotos.length
    setActivePhotoIndex(previousIndex)
  }

  const showNextPhoto = () => {
    if (!selectedPlacePhotos.length || activePhotoIndex === null) {
      return
    }

    const nextIndex = (activePhotoIndex + 1) % selectedPlacePhotos.length
    setActivePhotoIndex(nextIndex)
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePhoto()
        return
      }

      if (activePhotoIndex === null) {
        return
      }

      if (event.key === 'ArrowLeft') {
        showPreviousPhoto()
      }

      if (event.key === 'ArrowRight') {
        showNextPhoto()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePhotoIndex, selectedPlacePhotos.length])

  const openPlace = (placeSlug) => {
    window.location.hash = `place-${placeSlug}`
  }

  const openHome = () => {
    window.location.hash = 'home'
    closePhoto()
  }

  const openPhoto = (photoIndex) => {
    setActivePhotoIndex(photoIndex)
  }

  const goToSection = (sectionId) => {
    if (selectedPlace) {
      openHome()
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
      return
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleContactChange = (event) => {
    const { name, value } = event.target
    setContactForm((current) => ({ ...current, [name]: value }))
  }

  const handleContactSubmit = (event) => {
    event.preventDefault()
    const email = 'anaik98@gmail.com'
    const subject = encodeURIComponent(`Photography Inquiry from ${contactForm.name}`)
    const body = encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`
    )

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`

    setContactForm({
      name: '',
      email: '',
      message: ''
    })
  }

  const renderPlaceCards = (sectionPlaces, sectionName) => (
    <section className="places-grid" aria-label={`${sectionName} gallery`}>
      {sectionPlaces.map((place, index) => (
        <article
          key={place.slug}
          className="place-card"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <button
            type="button"
            className="place-link"
            onClick={() => openPlace(place.slug)}
            aria-label={`Open ${place.title}`}
          >
            <img src={place.coverImage} alt={place.title} loading="lazy" />
            <div className="place-overlay">
              <h2>{place.title}</h2>
              <p>{place.photos.length} photo{place.photos.length > 1 ? 's' : ''}</p>
              <span>Explore</span>
            </div>
          </button>
        </article>
      ))}
    </section>
  )

  return (
    <div className="page-shell">
      <header className="topbar">
        <button type="button" className="brand-button" onClick={openHome}>
          Ashwath Naik Photos
        </button>
        <nav className="top-menu" aria-label="Main navigation">
          <button type="button" onClick={() => goToSection('wedding')}>Wedding Photography</button>
          <button type="button" onClick={() => goToSection('events')}>Events</button>
          <button type="button" onClick={() => goToSection('contact')}>Contact</button>
        </nav>
      </header>

      {!selectedPlace && (
        <main className="view view-home" key="home-view">
          <section className="hero">
            <p className="eyebrow">Photography Portfolio</p>
            <h1>Landscapes with stories worth returning to.</h1>
            <p>
              Click any titled collection below to explore more photos from that place.
              Titles currently come from your image filenames and can be updated later.
            </p>
          </section>

          <section id="wedding" className="home-section">
            <div className="section-headline">
              <p className="eyebrow">Wedding Photography</p>
              <h2>Emotional storytelling with natural light and timeless tones.</h2>
            </div>
            {renderPlaceCards(weddingPlaces, 'Wedding Photography')}
          </section>

          <section id="events" className="home-section">
            <div className="section-headline">
              <p className="eyebrow">Events</p>
              <h2>Fast-paced moments, candid details, and cinematic highlights.</h2>
            </div>
            {renderPlaceCards(eventPlaces, 'Events')}
          </section>

          <section id="contact" className="home-section contact-section">
            <div className="section-headline">
              <p className="eyebrow">Contact</p>
              <h2>Tell me about your date, venue, and coverage needs.</h2>
            </div>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  rows="5"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                />
              </label>
              <button type="submit">Send Inquiry</button>
            </form>
          </section>
        </main>
      )}

      {selectedPlace && (
        <main className="view view-place" key="place-view">
          <section className="place-hero">
            <button type="button" className="back-button" onClick={openHome}>
              ← Back to home
            </button>
            <h1>{selectedPlace.title}</h1>
            <p>Explore this place collection with cinematic transitions and full-size framing.</p>
          </section>

          <section className="photo-grid" aria-label={`${selectedPlace.title} photos`}>
            {selectedPlace.photos.map((photo, index) => (
              <figure
                className="place-photo"
                key={`${selectedPlace.slug}-${photo.title}`}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <button
                  type="button"
                  className="photo-open-button"
                  onClick={() => openPhoto(index)}
                  aria-label={`View full size ${photo.title}`}
                >
                  <img src={photo.image} alt={photo.title} loading="lazy" />
                </button>
                <figcaption>{photo.title}</figcaption>
              </figure>
            ))}
          </section>
        </main>
      )}

      {activePhoto && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activePhoto.title}>
          <button type="button" className="lightbox-backdrop" onClick={closePhoto} aria-label="Close full image view" />
          <figure className="lightbox-content">
            <button
              type="button"
              className="lightbox-nav lightbox-nav-prev"
              onClick={showPreviousPhoto}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="lightbox-nav lightbox-nav-next"
              onClick={showNextPhoto}
              aria-label="Next image"
            >
              ›
            </button>
            <button type="button" className="lightbox-close" onClick={closePhoto} aria-label="Close">
              ×
            </button>
            <img src={activePhoto.image} alt={activePhoto.title} />
            <figcaption>{activePhoto.title}</figcaption>
          </figure>
        </div>
      )}
    </div>
  )
}

export default App

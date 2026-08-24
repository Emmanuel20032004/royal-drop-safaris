import { useState } from "react";
import { Link, useNavigate } from "react-router";

const categories = [
  { label: "Big 5 Safaris", type: "Safari" },
  { label: "Family Holiday Stays", type: "Hotel" },
  { label: "Beach + Bush Combos", type: "Combo" },
  { label: "Luxury Retreats", type: "Luxury" },
];

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const navigate = useNavigate();
  const [logoMissing, setLogoMissing] = useState(false);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (search.trim()) {
      navigate(`/packages?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="garage-page">
      <div className="top-bar">
        <div className="container top-bar-content">
          <span>Royal Drop Safaris • Curated Safari & Holiday Bookings</span>
          <span>Mon - Sun: 7:00 AM - 9:00 PM</span>
        </div>
      </div>

      <header className="header">
        <div className="container header-main">
          <a href="#" className="logo">
            {logoMissing ? (
              <span className="logo-box">RD</span>
            ) : (
              <img
                src="/royaldroplogo.png"
                alt="Royal Drop Safaris"
                className="brand-logo"
                onError={() => setLogoMissing(true)}
              />
            )}
            <span>
              Royal<span>Drop</span>
            </span>
          </a>

          <form className="desktop-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search safaris, hotels, parks or destinations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit">⌕</button>
          </form>

          <div className="header-right">
            <a href="tel:+254700000000" className="phone">
              <small>Bookings</small>
              <strong>+254 700 000 000</strong>
            </a>
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              ☰
            </button>
          </div>
        </div>

        <nav className={`navigation ${menuOpen ? "show" : ""}`}>
          <div className="container nav-content">
            <div className="category-dropdown">
              <button
                className="category-button"
                onClick={() => setCategoriesOpen((current) => !current)}
              >
                ☰ &nbsp; Package Categories
              </button>
              {categoriesOpen && (
                <div className="category-dropdown-menu">
                  {categories.map((category) => (
                    <Link
                      key={category.label}
                      to={`/packages?type=${encodeURIComponent(category.type)}`}
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="nav-links">
              <a href="#home" onClick={() => setMenuOpen(false)}>
                Home
              </a>
              <a href="#experiences" onClick={() => setMenuOpen(false)}>
                Experiences
              </a>
              <a href="#about" onClick={() => setMenuOpen(false)}>
                About
              </a>
              <Link to="/packages" onClick={() => setMenuOpen(false)}>
                Packages
              </Link>
              <a href="#contact" onClick={() => setMenuOpen(false)}>
                Contact
              </a>
            </div>

            <Link className="whatsapp-button" to="/packages">
              Book Now
            </Link>
          </div>
        </nav>

        <form className="container mobile-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit">⌕</button>
        </form>
      </header>

      <section className="hero" id="home">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="red-label">ROYAL DROP SAFARIS</span>
            <h1>
              Safari Adventures
              <br />
              <span>And Holiday Stays.</span>
            </h1>
            <p>
              Discover unforgettable wildlife tours, luxury lodges, and family
              holiday stays across Kenya and East Africa.
            </p>
            <div className="hero-buttons">
              <Link to="/packages" className="btn btn-accent">
                Explore Packages →
              </Link>
              <Link to="/admin/login" className="btn btn-outline">
                Admin Portal
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>100+</strong>
                <span>Curated Trips</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Guest Ratings</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Booking Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="categories section" id="experiences">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">OUR EXPERIENCES</span>
              <h2>Choose your travel style</h2>
            </div>
            <Link to="/packages">View all packages</Link>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.label}
                to={`/packages?type=${encodeURIComponent(category.type)}`}
                className="category-card"
              >
                <div className="category-icon">🌍</div>
                <h3>{category.label}</h3>
                <p>Tailored planning and easy booking</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="promotion">
        <div className="container promotion-content">
          <div>
            <span className="red-label">SEASONAL OFFERS</span>
            <h2>
              Save on selected
              <br />
              <span>safari and lodge packages.</span>
            </h2>
            <p>Early booking discounts available for selected dates.</p>
          </div>
          <Link to="/packages" className="btn btn-light">
            See Deals →
          </Link>
        </div>
      </section>

      <section className="about section" id="about">
        <div className="container about-grid">
          <div className="about-photo">
            <div className="about-badge">
              <strong>10+</strong> Years of travel planning
            </div>
          </div>
          <div className="about-content">
            <span className="section-label">ABOUT ROYAL DROP</span>
            <h2>We turn trip ideas into booked memories.</h2>
            <p>
              From wildlife safaris to relaxing holiday stays, we handle package
              planning, lodge coordination, and guest support end-to-end.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="container footer-content">
          <div>
            <h3>Royal Drop Safaris</h3>
            <p>Nairobi, Kenya</p>
          </div>
          <div>
            <p>Phone: +254 700 000 000</p>
            <p>Email: bookings@royaldropsafaris.test</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

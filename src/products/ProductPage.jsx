import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useFetch from "../hooks/useFetch";
import { API_BASE, apiFetch, getSession, userSessionKey } from "../auth/adminAuth.js";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: packageItem,
    loading,
    error,
  } = useFetch(`${API_BASE}/products/${id}`);

  const [guests, setGuests] = useState(1);
  const [checkInDate, setCheckInDate] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleBooking = () => {
    const session = getSession(userSessionKey);

    if (!session) {
      navigate("/login", { state: { from: `/package/${id}` } });
      return;
    }

    if (!session.verified) {
      setBookingStatus({
        type: "error",
        message:
          "Your account must be verified before submitting a booking request.",
      });
      return;
    }

    if (!checkInDate) {
      setBookingStatus({
        type: "error",
        message: "Please select your preferred check-in date.",
      });
      return;
    }

    setSubmitting(true);
    setBookingStatus(null);

    apiFetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: id,
        packageName: packageItem.name,
        packageType: packageItem.type,
        location: packageItem.location,
        price: packageItem.price,
        guests,
        checkInDate,
        userId: session.id,
        userEmail: session.email,
        status: "pending",
        createdAt: new Date().toISOString(),
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Booking request failed.");
        return response.json();
      })
      .then(() => {
        setBookingStatus({
          type: "success",
          message:
            "Booking request submitted. Our travel desk will contact you shortly.",
        });
      })
      .catch(() => {
        setBookingStatus({
          type: "error",
          message:
            "Unable to submit your booking right now. Please try again.",
        });
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-admin-900 via-[#102330] to-[#050a0f] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] bg-admin-panel/95 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)] sm:p-6 lg:p-8">
        {loading ? (
          <p className="text-admin-muted">Loading package...</p>
        ) : error ? (
          <p className="text-red-300">Error: {error}</p>
        ) : packageItem ? (
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-[2rem] bg-[#0f2438] p-3 shadow-[0_18px_34px_rgba(0,0,0,0.35)]">
              <img
                src={packageItem.image}
                alt={packageItem.name}
                className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[390px]"
              />
            </div>

            <div className="flex flex-col justify-center px-2 py-4">
              <p className="label">book with confidence</p>

              <h2 className="mt-4 text-5xl font-black leading-none tracking-[-0.07em] text-admin-ink sm:text-6xl">
                {packageItem.name}
              </h2>

              <p className="mt-3 text-2xl font-bold leading-none tracking-[-0.05em] text-admin-accentSoft sm:text-3xl">
                {packageItem.location}
              </p>

              <p className="mt-3 text-base text-admin-muted">
                {packageItem.type} • {packageItem.duration}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/packages" className="btn btn-accent">
                  Back to packages
                </Link>
              </div>

              <div className="card mt-6">
                <p className="label">Package details</p>
                <p className="mt-3 text-base leading-7 text-admin-muted">
                  {packageItem.description}
                </p>
                <p className="mt-4 text-2xl font-bold text-admin-pink">
                  KSh {packageItem.price} per person
                </p>
              </div>

              {Array.isArray(packageItem.rateCard) && packageItem.rateCard.length > 0 && (
                <div className="card mt-6 overflow-x-auto">
                  <p className="label">Room Rate Card (USD)</p>
                  <table className="mt-3 w-full min-w-[520px] border-collapse text-left text-sm text-admin-muted">
                    <thead>
                      <tr className="border-b border-admin-accent/25 text-admin-accentSoft">
                        <th className="py-2 pr-3">Room type</th>
                        <th className="py-2 pr-3">Twin/Double</th>
                        <th className="py-2 pr-3">Single</th>
                        <th className="py-2 pr-3">Triple Adults</th>
                        <th className="py-2 pr-3">Triple + Child</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packageItem.rateCard.map((row) => (
                        <tr key={row.roomType} className="border-b border-admin-accent/10">
                          <td className="py-2 pr-3 text-admin-ink">{row.roomType}</td>
                          <td className="py-2 pr-3">{row.twinDouble || "-"}</td>
                          <td className="py-2 pr-3">{row.single || "-"}</td>
                          <td className="py-2 pr-3">{row.tripleAdults || "-"}</td>
                          <td className="py-2 pr-3">{row.tripleWithChild || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card mt-6">
                <p className="label">Request this booking</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-sm text-admin-muted">
                    Guests
                    <input
                      type="number"
                      min="1"
                      value={guests}
                      onChange={(event) =>
                        setGuests(Math.max(1, Number(event.target.value) || 1))
                      }
                      className="mt-1 w-24 rounded-lg border border-admin-accent/30 bg-admin-900 px-3 py-2 text-admin-ink outline-none focus:border-admin-accent"
                    />
                  </label>
                  <label className="text-sm text-admin-muted">
                    Check-in date
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(event) => setCheckInDate(event.target.value)}
                      className="mt-1 rounded-lg border border-admin-accent/30 bg-admin-900 px-3 py-2 text-admin-ink outline-none focus:border-admin-accent"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={submitting}
                    className="btn btn-accent disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Request booking"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-admin-muted">
                  Sign in to submit a booking request. <Link to="/login" className="font-semibold text-admin-accentSoft hover:underline">Sign in</Link> or <Link to="/register" className="font-semibold text-admin-accentSoft hover:underline">create account</Link>.
                </p>
                <a
                  href="https://wa.me/254703790120"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                >
                  Talk to a company rep on WhatsApp: +254 703 790120
                </a>
                {bookingStatus && (
                  <p
                    className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                      bookingStatus.type === "success"
                        ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border border-red-400/30 bg-red-500/10 text-red-200"
                    }`}
                  >
                    {bookingStatus.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProductPage;

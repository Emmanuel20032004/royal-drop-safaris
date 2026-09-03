import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CalendarClock, Home, LogOut, PackagePlus, Pencil, ShieldCheck, Trash2, Users, X } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { API_BASE, adminSessionKey, getSession } from "../auth/adminAuth.js";

const emptyPackage = {
  name: "",
  type: "Safari",
  location: "",
  duration: "",
  description: "",
  price: "",
  image: "",
};

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

export function AdminSidebar() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Dashboard");
  const currentAdmin = getSession(adminSessionKey);

  const { data: fetchedPackages, loading, error } = useFetch(`${API_BASE}/products`);
  const { data: fetchedBookings } = useFetch(`${API_BASE}/orders`);
  const { data: fetchedUsers, error: usersError } = useFetch(`${API_BASE}/users`);

  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [newPackage, setNewPackage] = useState(emptyPackage);
  const [editingPackage, setEditingPackage] = useState(null);
  const [savingImage, setSavingImage] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userVerificationFilter, setUserVerificationFilter] = useState("All");

  // Keep editable local collections synchronized when the API response changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (fetchedPackages) setPackages(fetchedPackages);
  }, [fetchedPackages]);

  useEffect(() => {
    if (fetchedBookings) setBookings(fetchedBookings);
  }, [fetchedBookings]);

  useEffect(() => {
    if (fetchedUsers) setUsers(fetchedUsers);
  }, [fetchedUsers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visiblePackages = useMemo(() => {
    return packages.filter((item) =>
      [item.name, item.type, item.location, item.duration]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [packages, searchTerm]);

  const pendingCustomers = useMemo(() => {
    return users.filter((user) => user.role === "Customer" && !user.verified);
  }, [users]);

  const allUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.role === b.role) return (a.name || "").localeCompare(b.name || "");
      return (a.role || "").localeCompare(b.role || "");
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const searchMatches = [user.name, user.email, user.phone, user.role]
        .join(" ")
        .toLowerCase()
        .includes(userSearchTerm.toLowerCase());

      const roleMatches = userRoleFilter === "All" || user.role === userRoleFilter;

      const verificationMatches =
        userVerificationFilter === "All" ||
        (userVerificationFilter === "Verified" && user.verified) ||
        (userVerificationFilter === "Unverified" && !user.verified);

      return searchMatches && roleMatches && verificationMatches;
    });
  }, [allUsers, userRoleFilter, userSearchTerm, userVerificationFilter]);

  const adminCount = useMemo(() => {
    return users.filter((user) => user.role === "Admin").length;
  }, [users]);

  const confirmCustomerRequest = (userId) => {
    setProcessingUserId(userId);
    fetch(`${API_BASE}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: true }),
    })
      .then((response) => response.json())
      .then((updatedUser) => {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.id === updatedUser.id ? { ...user, verified: true } : user,
          ),
        );
      })
      .catch((err) => console.error("Failed to verify customer", err))
      .finally(() => setProcessingUserId(null));
  };

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const confirmBooking = (bookingId) => {
    setProcessingBookingId(bookingId);
    fetch(`${API_BASE}/orders/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
      }),
    })
      .then((response) => response.json())
      .then((updatedBooking) => {
        setBookings((currentBookings) =>
          currentBookings.map((booking) =>
            booking.id === updatedBooking.id ? updatedBooking : booking,
          ),
        );
      })
      .catch((err) => console.error("Failed to confirm booking", err))
      .finally(() => setProcessingBookingId(null));
  };

  const deleteBookingRequest = (booking) => {
    if (!window.confirm(`Delete booking request for ${booking.packageName || booking.productName}?`)) return;

    setDeletingBookingId(booking.id);
    fetch(`${API_BASE}/orders/${booking.id}`, {
      method: "DELETE",
    })
      .then(() => {
        setBookings((currentBookings) =>
          currentBookings.filter((currentBooking) => currentBooking.id !== booking.id),
        );
      })
      .catch((err) => console.error("Failed to delete booking request", err))
      .finally(() => setDeletingBookingId(null));
  };

  const deleteUser = (user) => {
    if (user.id === currentAdmin?.id) {
      window.alert("You cannot delete the account currently signed in.");
      return;
    }

    if (user.role === "Admin" && adminCount <= 1) {
      window.alert("At least one admin account must remain in the system.");
      return;
    }

    if (!window.confirm(`Delete user account for ${user.name}?`)) return;

    setDeletingUserId(user.id);
    fetch(`${API_BASE}/users/${user.id}`, {
      method: "DELETE",
    })
      .then(() => {
        setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      })
      .catch((err) => console.error("Failed to delete user", err))
      .finally(() => setDeletingUserId(null));
  };

  const addPackage = (event) => {
    event.preventDefault();
    if (!newPackage.name || !newPackage.location || !newPackage.price) return;

    fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newPackage,
        price: Number(newPackage.price),
      }),
    })
      .then((response) => response.json())
      .then((savedItem) => {
        setPackages((current) => [...current, savedItem]);
        setNewPackage(emptyPackage);
        setShowAddPackage(false);
      })
      .catch((err) => console.error("Failed to add package", err));
  };

  const handleAddImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSavingImage(true);
    try {
      const imageAsDataUrl = await toDataUrl(file);
      setNewPackage((current) => ({ ...current, image: imageAsDataUrl }));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingImage(false);
    }
  };

  const handleEditImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSavingImage(true);
    try {
      const imageAsDataUrl = await toDataUrl(file);
      setEditingPackage((current) => ({ ...current, image: imageAsDataUrl }));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingImage(false);
    }
  };

  const savePackage = (event) => {
    event.preventDefault();
    if (!editingPackage?.id) return;

    fetch(`${API_BASE}/products/${editingPackage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editingPackage,
        price: Number(editingPackage.price) || 0,
      }),
    })
      .then((response) => response.json())
      .then((updatedItem) => {
        setPackages((current) =>
          current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        );
        setEditingPackage(null);
      })
      .catch((err) => console.error("Failed to update package", err));
  };

  const removePackage = (item) => {
    if (!window.confirm(`Remove ${item.name} from available packages?`)) return;
    fetch(`${API_BASE}/products/${item.id}`, { method: "DELETE" })
      .then(() => {
        setPackages((current) => current.filter((pkg) => pkg.id !== item.id));
      })
      .catch((err) => console.error("Failed to delete package", err));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      <div className="w-[30%] flex-shrink-0 bg-gradient-to-b from-admin-800 to-admin-900 px-6 py-8 flex flex-col overflow-y-auto border-r border-admin-accent/20">
        <div className="mb-8 pb-6 border-b border-admin-accent/20">
          <h2 className="text-lg font-bold text-admin-accent">Royal Drop Admin</h2>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-admin-accent/70 hover:text-admin-accent transition-colors"
          >
            ← Back to Site
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {["Dashboard", "Packages", "Bookings", "Customer Requests", "Users"].map((item) => {
            const Icon =
              item === "Dashboard"
                ? Home
                : item === "Packages"
                  ? PackagePlus
                  : item === "Bookings"
                    ? CalendarClock
                    : item === "Customer Requests"
                      ? ShieldCheck
                      : Users;
            const isActive = activeView === item;
            return (
              <button
                key={item}
                onClick={() => setActiveView(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? "bg-admin-accent/20 text-admin-accent"
                    : "text-admin-muted hover:bg-admin-800/80 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(adminSessionKey);
            navigate("/admin/login", { replace: true });
          }}
          className="mt-6 flex w-full items-center gap-3 rounded px-4 py-3 text-sm font-medium text-[#d4c9ef] transition-colors hover:bg-[#241a5f]/80 hover:text-white"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-admin-900 via-admin-panel to-[#0a0f14]">
        <header className="relative z-10 flex items-center justify-between bg-admin-gradient px-12 py-5 text-4xl font-bold text-admin-ink shadow-lg">
          Admin &gt; {activeView}
        </header>

        <main className="relative z-10 flex-1 overflow-auto px-10 py-10">
          {loading ? (
            <p className="text-admin-muted">Loading packages...</p>
          ) : error ? (
            <p className="text-red-300">Error loading packages: {error}</p>
          ) : activeView === "Packages" ? (
            <section className="max-w-7xl">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-admin-accent">
                    Package management
                  </p>
                  <h1 className="text-4xl font-bold text-admin-ink">Manage packages</h1>
                  <p className="mt-2 text-sm text-admin-muted">
                    Add, edit, or remove safari and hotel packages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPackage(true)}
                  className="flex items-center gap-2 rounded-lg bg-admin-accent px-5 py-3 text-sm font-bold text-admin-700 shadow-lg transition hover:bg-admin-accentSoft"
                >
                  <PackagePlus size={18} />
                  Add package
                </button>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-admin-accent/20 bg-admin-900/50 p-3">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search package, location, or type"
                  className="w-full rounded-lg border border-admin-accent/20 bg-admin-surface px-4 py-3 text-sm text-admin-ink outline-none transition focus:border-admin-accent"
                />
                <div className="rounded-lg border border-admin-accent/20 px-4 py-3 text-sm text-admin-muted">
                  {visiblePackages.length} packages shown
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 md:grid-cols-2">
                {visiblePackages.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-admin-accent/20 bg-admin-panel/95 shadow-xl"
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-admin-800 via-admin-900 to-admin-panel">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-4 top-4 rounded bg-[#2b9c2b] px-3 py-1 text-xs font-bold text-white">
                        ACTIVE
                      </span>
                    </div>
                    <div className="p-5">
                      <h2 className="text-lg font-bold text-admin-ink">{item.name}</h2>
                      <p className="mt-1 text-sm text-admin-muted">{item.location}</p>
                      <p className="mt-1 text-xs text-admin-muted">{item.type} • {item.duration}</p>
                      <p className="mt-4 text-lg font-bold text-[#ff5f5f]">KSh {item.price}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPackage({ ...item })}
                          className="flex items-center gap-1.5 rounded-lg border border-admin-accent/35 px-3 py-2 text-xs font-semibold text-admin-accent transition hover:bg-admin-accent/10"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removePackage(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/15 hover:text-white"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : activeView === "Bookings" ? (
            <section className="max-w-7xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-admin-accent">
                Incoming requests
              </p>
              <h1 className="text-4xl font-bold text-admin-ink">Booking requests</h1>
              <p className="mt-2 mb-7 text-sm text-admin-muted">
                Monitor guest booking requests submitted by customers.
              </p>

              <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-admin-panel/95 shadow-xl">
                <div className="hidden grid-cols-[2fr_1.1fr_1fr_1.2fr_1.1fr] gap-4 border-b border-admin-accent/20 bg-admin-600 px-5 py-4 text-xs font-bold uppercase tracking-wider text-admin-muted md:grid">
                  <span>Package</span>
                  <span>Guest</span>
                  <span>Date</span>
                  <span>Contact</span>
                  <span>Status</span>
                </div>
                {(bookings || []).map((booking) => (
                  <div
                    key={booking.id}
                    className="grid gap-4 border-b border-admin-accent/20 px-5 py-4 last:border-b-0 md:grid-cols-[2fr_1.1fr_1fr_1.2fr_1.1fr] md:items-center"
                  >
                    <div className="text-admin-ink">{booking.packageName || booking.productName}</div>
                    <div className="text-sm text-admin-muted">
                      <p className="text-admin-ink">{usersById.get(booking.userId)?.name || "Customer"}</p>
                      <p>{booking.userEmail}</p>
                    </div>
                    <div className="text-sm text-admin-muted">{booking.checkInDate || "Not set"}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {usersById.get(booking.userId)?.phone ? (
                        <>
                          <a
                            href={`tel:${usersById.get(booking.userId).phone}`}
                            className="rounded border border-admin-accent/30 px-2 py-1 text-admin-accent hover:bg-admin-accent/10"
                          >
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${usersById.get(booking.userId).phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-emerald-400/30 px-2 py-1 text-emerald-300 hover:bg-emerald-500/10"
                          >
                            WhatsApp
                          </a>
                        </>
                      ) : (
                        <span className="text-admin-muted">No phone</span>
                      )}
                      <a
                        href={`mailto:${booking.userEmail}`}
                        className="rounded border border-admin-accent/30 px-2 py-1 text-admin-accent hover:bg-admin-accent/10"
                      >
                        Email
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={booking.status === "confirmed" ? "text-emerald-300" : "text-amber-300"}>
                        {booking.status}
                      </span>
                      {booking.status !== "confirmed" && (
                        <button
                          type="button"
                          onClick={() => confirmBooking(booking.id)}
                          disabled={processingBookingId === booking.id}
                          className="rounded-lg bg-admin-accent px-2.5 py-1 text-xs font-bold text-admin-700 transition hover:bg-admin-accentSoft disabled:opacity-60"
                        >
                          {processingBookingId === booking.id ? "Confirming..." : "Confirm"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteBookingRequest(booking)}
                        disabled={deletingBookingId === booking.id}
                        className="rounded-lg border border-red-400/40 px-2.5 py-1 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingBookingId === booking.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
                {(bookings || []).length === 0 && (
                  <p className="p-8 text-center text-admin-muted">No bookings yet.</p>
                )}
              </div>
            </section>
          ) : activeView === "Customer Requests" ? (
            <section className="max-w-7xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-admin-accent">
                Account verification
              </p>
              <h1 className="text-4xl font-bold text-admin-ink">Customer creation requests</h1>
              <p className="mt-2 mb-7 text-sm text-admin-muted">
                Confirm customer signups so they can log in and request bookings.
              </p>

              <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-admin-panel/95 shadow-xl">
                <div className="hidden grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-4 border-b border-admin-accent/20 bg-admin-600 px-5 py-4 text-xs font-bold uppercase tracking-wider text-admin-muted md:grid">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Phone</span>
                  <span>Action</span>
                </div>
                {pendingCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="grid gap-4 border-b border-admin-accent/20 px-5 py-4 last:border-b-0 md:grid-cols-[1.3fr_1.3fr_1fr_1fr] md:items-center"
                  >
                    <div className="text-admin-ink">{customer.name}</div>
                    <div className="break-all text-sm text-admin-muted">{customer.email}</div>
                    <div className="text-sm text-admin-muted">{customer.phone || "Not provided"}</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => confirmCustomerRequest(customer.id)}
                        disabled={processingUserId === customer.id}
                        className="rounded-lg bg-admin-accent px-3 py-2 text-xs font-bold text-admin-700 transition hover:bg-admin-accentSoft disabled:opacity-60"
                      >
                        {processingUserId === customer.id ? "Confirming..." : "Confirm request"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(customer)}
                        disabled={deletingUserId === customer.id}
                        className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingUserId === customer.id ? "Deleting..." : "Delete user"}
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCustomers.length === 0 && (
                  <p className="p-8 text-center text-admin-muted">No pending customer requests.</p>
                )}
                {usersError && (
                  <p className="border-t border-admin-accent/20 p-4 text-center text-sm text-red-300">
                    Unable to load customer requests from the API.
                  </p>
                )}
              </div>
            </section>
          ) : activeView === "Users" ? (
            <section className="max-w-7xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-admin-accent">
                Access management
              </p>
              <h1 className="text-4xl font-bold text-admin-ink">All users</h1>
              <p className="mt-2 mb-7 text-sm text-admin-muted">
                Remove accounts that are no longer required.
              </p>

              <div className="mb-6 space-y-3 rounded-xl border border-admin-accent/20 bg-admin-900/50 p-4">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(event) => setUserSearchTerm(event.target.value)}
                  placeholder="Search users by name, email, phone, or role"
                  className="w-full rounded-lg border border-admin-accent/20 bg-admin-surface px-4 py-3 text-sm text-admin-ink outline-none transition focus:border-admin-accent"
                />
                <div className="flex flex-wrap gap-2">
                  {["All", "Admin", "Customer"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setUserRoleFilter(role)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        userRoleFilter === role
                          ? "border-admin-accent bg-admin-accent/15 text-admin-accent"
                          : "border-admin-accent/20 text-admin-muted hover:border-admin-accent/40"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                  {["All", "Verified", "Unverified"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setUserVerificationFilter(status)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        userVerificationFilter === status
                          ? "border-admin-accent bg-admin-accent/15 text-admin-accent"
                          : "border-admin-accent/20 text-admin-muted hover:border-admin-accent/40"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-admin-muted">Showing {filteredUsers.length} user(s)</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-admin-panel/95 shadow-xl">
                <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_0.8fr_1fr] gap-4 border-b border-admin-accent/20 bg-admin-600 px-5 py-4 text-xs font-bold uppercase tracking-wider text-admin-muted md:grid">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Phone</span>
                  <span>Role</span>
                  <span>Action</span>
                </div>
                {filteredUsers.map((user) => {
                  const cannotDeleteSelf = user.id === currentAdmin?.id;
                  const cannotDeleteLastAdmin = user.role === "Admin" && adminCount <= 1;
                  const cannotDelete = cannotDeleteSelf || cannotDeleteLastAdmin;

                  return (
                    <div
                      key={user.id}
                      className="grid gap-4 border-b border-admin-accent/20 px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_1fr] md:items-center"
                    >
                      <div className="text-admin-ink">{user.name}</div>
                      <div className="break-all text-sm text-admin-muted">{user.email}</div>
                      <div className="text-sm text-admin-muted">{user.phone || "Not provided"}</div>
                      <div className="text-sm text-admin-muted">{user.role}</div>
                      <div>
                        <button
                          type="button"
                          onClick={() => deleteUser(user)}
                          disabled={cannotDelete || deletingUserId === user.id}
                          className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {deletingUserId === user.id ? "Deleting..." : cannotDelete ? "Protected" : "Delete user"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="p-8 text-center text-admin-muted">No users available.</p>
                )}
                {usersError && (
                  <p className="border-t border-admin-accent/20 p-4 text-center text-sm text-red-300">
                    Unable to load users from the API.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <section className="max-w-7xl">
              <div className="mb-12">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-admin-accent">
                  Dashboard overview
                </p>
                <h1 className="text-4xl font-bold text-admin-ink">Royal Drop metrics</h1>
                <p className="mt-3 text-sm text-admin-muted">
                  Quick snapshot of package catalogue and booking activity.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-gradient-to-br from-admin-800/40 to-admin-panel/40 shadow-lg p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-admin-accent/70">Total packages</p>
                  <p className="mt-4 text-4xl font-black leading-none tracking-tight text-admin-ink">{packages.length}</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-gradient-to-br from-admin-800/40 to-admin-panel/40 shadow-lg p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-admin-accent/70">Booking requests</p>
                  <p className="mt-4 text-4xl font-black leading-none tracking-tight text-admin-ink">{(bookings || []).length}</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-gradient-to-br from-admin-800/40 to-admin-panel/40 shadow-lg p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-admin-accent/70">Destinations covered</p>
                  <p className="mt-4 text-4xl font-black leading-none tracking-tight text-admin-ink">
                    {new Set((packages || []).map((item) => item.location)).size}
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-admin-accent/20 bg-gradient-to-br from-admin-800/40 to-admin-panel/40 shadow-lg p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-admin-accent/70">Pending customer requests</p>
                  <p className="mt-4 text-4xl font-black leading-none tracking-tight text-admin-ink">{pendingCustomers.length}</p>
                </div>
              </div>
            </section>
          )}
        </main>

        {showAddPackage && (
          <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/75 p-6 backdrop-blur-sm">
            <form
              onSubmit={addPackage}
              className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#f6c55a]/30 bg-[#121036] p-7 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-admin-ink">Add package</h2>
                <button
                  type="button"
                  onClick={() => setShowAddPackage(false)}
                  className="text-admin-muted transition hover:text-admin-ink"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "name", label: "Package name" },
                  { key: "type", label: "Type" },
                  { key: "location", label: "Location" },
                  { key: "duration", label: "Duration" },
                  { key: "price", label: "Price", type: "number" },
                ].map((field) => (
                  <label key={field.key} className="text-sm text-admin-muted">
                    {field.label}
                    <input
                      required
                      type={field.type || "text"}
                      value={newPackage[field.key]}
                      onChange={(event) =>
                        setNewPackage({
                          ...newPackage,
                          [field.key]: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                    />
                  </label>
                ))}
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Image URL
                  <input
                    type="text"
                    value={newPackage.image}
                    onChange={(event) =>
                      setNewPackage({
                        ...newPackage,
                        image: event.target.value,
                      })
                    }
                    placeholder="https://example.com/package-image.jpg"
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                  />
                </label>
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Or upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAddImageFile}
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink file:mr-3 file:rounded-md file:border-0 file:bg-admin-accent file:px-3 file:py-1 file:text-admin-700 file:font-semibold"
                  />
                </label>
                {savingImage && (
                  <p className="text-xs text-admin-muted sm:col-span-2">Processing selected image...</p>
                )}
                {newPackage.image && (
                  <img
                    src={newPackage.image}
                    alt="New package preview"
                    className="h-32 w-full rounded-lg border border-admin-accent/20 object-cover sm:col-span-2"
                  />
                )}
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Description
                  <textarea
                    required
                    rows={4}
                    value={newPackage.description}
                    onChange={(event) =>
                      setNewPackage({ ...newPackage, description: event.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                  />
                </label>
              </div>
              <button type="submit" className="mt-6 w-full rounded-lg bg-[#f6c55a] py-3 font-bold text-[#1a1644] transition hover:bg-[#ffe18f]">
                Save package
              </button>
            </form>
          </div>
        )}

        {editingPackage && (
          <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/75 p-6 backdrop-blur-sm">
            <form
              onSubmit={savePackage}
              className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#f6c55a]/30 bg-[#121036] p-7 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-admin-ink">Edit package</h2>
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="text-admin-muted transition hover:text-admin-ink"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "name", label: "Package name" },
                  { key: "type", label: "Type" },
                  { key: "location", label: "Location" },
                  { key: "duration", label: "Duration" },
                  { key: "price", label: "Price", type: "number" },
                ].map((field) => (
                  <label key={field.key} className="text-sm text-admin-muted">
                    {field.label}
                    <input
                      required
                      type={field.type || "text"}
                      value={editingPackage[field.key] || ""}
                      onChange={(event) =>
                        setEditingPackage({
                          ...editingPackage,
                          [field.key]: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                    />
                  </label>
                ))}
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Image URL
                  <input
                    type="text"
                    value={editingPackage.image || ""}
                    onChange={(event) =>
                      setEditingPackage({
                        ...editingPackage,
                        image: event.target.value,
                      })
                    }
                    placeholder="https://example.com/package-image.jpg"
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                  />
                </label>
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Replace image with file
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleEditImageFile}
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink file:mr-3 file:rounded-md file:border-0 file:bg-admin-accent file:px-3 file:py-1 file:text-admin-700 file:font-semibold"
                  />
                </label>
                {savingImage && (
                  <p className="text-xs text-admin-muted sm:col-span-2">Processing selected image...</p>
                )}
                {editingPackage.image && (
                  <img
                    src={editingPackage.image}
                    alt="Edited package preview"
                    className="h-32 w-full rounded-lg border border-admin-accent/20 object-cover sm:col-span-2"
                  />
                )}
                <label className="text-sm text-admin-muted sm:col-span-2">
                  Description
                  <textarea
                    required
                    rows={4}
                    value={editingPackage.description || ""}
                    onChange={(event) =>
                      setEditingPackage({ ...editingPackage, description: event.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-admin-accent/20 bg-admin-900 px-3 py-3 text-admin-ink outline-none focus:border-admin-accent"
                  />
                </label>
              </div>
              <button type="submit" className="mt-6 w-full rounded-lg bg-[#f6c55a] py-3 font-bold text-[#1a1644] transition hover:bg-[#ffe18f]">
                Save changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

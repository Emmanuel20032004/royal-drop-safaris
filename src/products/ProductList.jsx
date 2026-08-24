import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import useFetch from "../hooks/useFetch";
import { API_BASE } from "../auth/adminAuth.js";

function ProductList() {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");
  const searchFromUrl = searchParams.get("search");

  const [searchTerm, setSearchTerm] = useState(searchFromUrl || "");
  const {
    data: packages,
    loading,
    error,
  } = useFetch(`${API_BASE}/products`);

  const filteredPackages = useMemo(() => {
    return (packages || []).filter((item) => {
      const bundleText = [item.name, item.location, item.type, item.description]
        .join(" ")
        .toLowerCase();

      const matchesSearch = bundleText.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter
        ? (item.type || "").toLowerCase() === typeFilter.toLowerCase()
        : true;

      return matchesSearch && matchesType;
    });
  }, [packages, searchTerm, typeFilter]);

  return (
    <div className="min-h-screen bg-admin-900 px-4 py-10 text-admin-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-[1.75rem] border border-admin-accent/20 bg-gradient-to-r from-admin-800 to-admin-900 p-5 shadow-admin sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-admin-accent">
                Royal Drop Safaris
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-admin-ink sm:text-5xl">
                Safari & Hotel Packages
              </h1>
            </div>
            <Link to="/" className="btn btn-accent">
              Back to home
            </Link>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-admin-accent/30 bg-admin-surface p-4 shadow-admin md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search packages, destinations, or stays..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-admin-accent/50 bg-admin-900 px-4 py-3 text-admin-ink outline-none transition focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 md:max-w-md"
          />
          <div className="inline-flex items-center justify-center rounded-full border border-admin-accent/25 bg-admin-900 px-4 py-2 text-sm font-semibold text-admin-muted shadow-inner shadow-black/10">
            <span className="mr-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-admin-accent/10 px-2 text-xs font-bold text-admin-accent">
              {filteredPackages.length}
            </span>
            <span>package{filteredPackages.length === 1 ? "" : "s"} shown</span>
          </div>
        </div>

        {loading ? (
          <p className="rounded-2xl border border-admin-accent/15 bg-admin-surface p-8 text-center text-admin-muted">
            Loading packages...
          </p>
        ) : error ? (
          <p className="rounded-2xl border border-red-400/30 bg-red-950/20 p-8 text-center text-red-200">
            Error: {error}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPackages.map((item) => (
              <Link
                key={item.id}
                to={`/package/${item.id}`}
                className="group overflow-hidden rounded-[1.5rem] border border-admin-accent/15 bg-admin-surface shadow-admin transition duration-200 hover:-translate-y-1 hover:border-admin-accent/40"
              >
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-admin-800 via-admin-900 to-black">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-admin-accent/30 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-admin-accent backdrop-blur-sm">
                    {item.type}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="text-[1.2rem] font-bold leading-tight text-admin-ink">
                    {item.name}
                  </h3>
                  <p className="text-sm text-admin-muted">{item.location}</p>
                  <p className="text-xs text-admin-muted">{item.duration}</p>
                  <p className="text-lg font-bold text-admin-pink">KSh {item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;

import React, { useEffect, useRef, useState } from "react";
import {
  FaEdit,
  FaFileExport,
  FaFileImport,
  FaPlus,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import AddVehicleModal from "../../components/Admin/AddVehicleModal";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import EditVehicleModal from "../../components/Admin/EditVehicleModal";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/AdminVehicles.css";

const PAGE_SIZE = 5;

const getVisiblePages = (currentPage, totalPages) => {
  const end = Math.min(totalPages, Math.max(3, currentPage + 1));
  const start = Math.max(1, end - 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const AdminVehicles = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState("");

  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    year: "",
    status: "",
    q: "",
  });

  const csvInputRef = useRef(null);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const showingFrom = vehicles.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const visiblePages = getVisiblePages(page, pages);

  const fetchVehicles = async (targetPage = page, targetFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage,
        limit: PAGE_SIZE,
        ...targetFilters,
      });
      const res = await api.get(`${BASE_URL}/api/vehicles?${params.toString()}`);

      if (res.data.success) {
        setVehicles(res.data.vehicles);
        setPages(res.data.pages);
        setPage(res.data.page);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilters = () => fetchVehicles(1, filters);

  const resetFilters = () => {
    const clearedFilters = {
      brand: "",
      model: "",
      year: "",
      status: "",
      q: "",
    };

    setFilters(clearedFilters);
    fetchVehicles(1, clearedFilters);
  };

  const deleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    await api.delete(`${BASE_URL}/api/vehicles/${id}`);
    fetchVehicles();
  };

  const exportCSV = () => {
    window.location.href = `${api.defaults.baseURL}/api/vehicles/export/csv`;
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`${BASE_URL}/api/vehicles/import/csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("CSV imported");
      fetchVehicles();
    } catch {
      alert("CSV import failed");
    } finally {
      e.target.value = "";
    }
  };

  const syncBeForward = async () => {
    if (
      !window.confirm(
        "Run a full BeForward sync now? BeForward vehicles missing from the latest feed will be marked as sold."
      )
    ) {
      return;
    }

    try {
      setSyncing(true);
      const res = await api.post(`${BASE_URL}/api/vehicles/import/beforward`, {});
      const summary = res.data.message || "BeForward sync completed.";
      setSyncSummary(summary);
      alert(summary);
      fetchVehicles(1, filters);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sync BeForward vehicles");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />

        <div className="admin-content">
          <section className="vehicles-shell">
            <div className="vehicles-toolbar">
              <div className="actions">
                <button className="btn add" onClick={() => setShowAdd(true)}>
                  <FaPlus /> Add
                </button>

                <button className="btn" onClick={exportCSV}>
                  <FaFileExport /> Export CSV
                </button>

                <button className="btn" onClick={() => csvInputRef.current?.click()}>
                  <FaFileImport /> Import CSV
                </button>

                <input
                  type="file"
                  accept=".csv"
                  ref={csvInputRef}
                  style={{ display: "none" }}
                  onChange={importCSV}
                />

                <button
                  className="btn import"
                  onClick={syncBeForward}
                  disabled={syncing}
                >
                  <FaSyncAlt /> {syncing ? "Syncing..." : "Sync Be Forward"}
                </button>
              </div>
            </div>

            {syncSummary && <p className="sync-summary">{syncSummary}</p>}

            <div className="vehicles-filter-panel">
              <div className="vehicles-filter-head">
                <div>
                  <h3>Refine Listings</h3>
                  <p>Filter inventory by keyword, brand, model, year, or sales status.</p>
                </div>
              </div>

              <div className="vehicle-filters">
                <input
                  name="q"
                  placeholder="Search title, stock, or model..."
                  value={filters.q}
                  onChange={handleFilterChange}
                />
                <input
                  name="brand"
                  placeholder="Brand"
                  value={filters.brand}
                  onChange={handleFilterChange}
                />
                <input
                  name="model"
                  placeholder="Model"
                  value={filters.model}
                  onChange={handleFilterChange}
                />
                <input
                  name="year"
                  type="number"
                  placeholder="Year"
                  value={filters.year}
                  onChange={handleFilterChange}
                />
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All status</option>
                  <option>Available</option>
                  <option>Pending</option>
                  <option>Sold</option>
                </select>

                <button className="btn filter" onClick={applyFilters}>
                  Apply
                </button>
                <button className="btn reset" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>

            {loading ? (
              <div className="vehicles-empty-state">
                <p>Loading inventory...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="vehicles-empty-state">
                <h3>No vehicles found</h3>
                <p>Try widening your filters or sync a fresh batch from Be Forward.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="vehicle-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Listing</th>
                      <th>Specs</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Media</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehicles.map((vehicle, index) => (
                      <tr key={vehicle._id}>
                        <td data-label="Image" className="image-cell">
                          <img
                            src={vehicle.images?.[0]?.url || "/placeholder-car.jpg"}
                            alt={vehicle.title || `${vehicle.brand} ${vehicle.model}`}
                            className="tbl-thumb"
                          />
                        </td>

                        <td data-label="Listing" className="title-cell">
                          <div className="vehicle-title-block">
                            <strong>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</strong>

                            <div className="vehicle-title-meta">
                              <span className="index-pill">#{showingFrom + index}</span>
                              <span className="stock-pill">
                                {vehicle.stockNumber || "No stock no."}
                              </span>
                              <span
                                className={`source-pill ${
                                  vehicle.source === "beforward" ? "live" : ""
                                }`}
                              >
                                {vehicle.source === "beforward" ? "Be Forward" : "Local"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td data-label="Specs" className="specs-cell">
                          <div className="spec-grid">
                            <div className="spec-line">
                              <span>Brand</span>
                              <strong>{vehicle.brand || "N/A"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Model</span>
                              <strong>{vehicle.model || "N/A"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Year</span>
                              <strong>{vehicle.year || "N/A"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Mileage</span>
                              <strong>
                                {vehicle.mileage
                                  ? `${vehicle.mileage.toLocaleString()} km`
                                  : "N/A"}
                              </strong>
                            </div>
                            <div className="spec-line">
                              <span>Fuel</span>
                              <strong>{vehicle.fuelType || "N/A"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Trans</span>
                              <strong>{vehicle.transmission || "N/A"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Drive</span>
                              <strong>{vehicle.driveType || "2WD"}</strong>
                            </div>
                            <div className="spec-line">
                              <span>Location</span>
                              <strong>{vehicle.location || "Japan"}</strong>
                            </div>
                          </div>
                        </td>

                        <td data-label="Price" className="price-cell">
                          <strong className="price-main">
                            KES {Number(vehicle.price || 0).toLocaleString()}
                          </strong>

                          {vehicle.sourcePrice && vehicle.sourceCurrency && (
                            <span className="price-sub">
                              Source: {vehicle.sourceCurrency}{" "}
                              {Number(vehicle.sourcePrice).toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td data-label="Status">
                          <span className={`status ${vehicle.status?.toLowerCase()}`}>
                            {vehicle.status}
                          </span>
                        </td>

                        <td data-label="Media">
                          <div className="media-flags">
                            <span className={`flag ${vehicle.auctionSheetUrl ? "green" : "grey"}`}>
                              AS
                            </span>
                            <span
                              className={`flag ${
                                vehicle.spinImages?.length > 0 ? "blue" : "grey"
                              }`}
                            >
                              360
                            </span>

                            <div className="tech-icons">
                              {vehicle.bluetooth && <span className="ti">BT</span>}
                              {vehicle.navigation && <span className="ti">NAV</span>}
                              {vehicle.reverseCamera && <span className="ti">CAM</span>}
                              {vehicle.hasScreen && <span className="ti">SCR</span>}
                            </div>
                          </div>
                        </td>

                        <td data-label="Actions" className="row-actions">
                          <button
                            className="edit-btn"
                            title="Edit vehicle"
                            onClick={() => {
                              setSelected(vehicle);
                              setShowEdit(true);
                            }}
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="delete-btn"
                            title="Delete vehicle"
                            onClick={() => deleteVehicle(vehicle._id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pager">
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      setPage(page - 1);
                      fetchVehicles(page - 1, filters);
                    }}
                  >
                    Prev
                  </button>

                  <div className="pager-center">
                    <span>
                      Page {page} of {pages}
                    </span>

                    <div className="pager-numbers">
                      {visiblePages.map((pageNumber) => (
                        <button
                          key={pageNumber}
                          className={pageNumber === page ? "active" : ""}
                          onClick={() => {
                            if (pageNumber === page) return;
                            setPage(pageNumber);
                            fetchVehicles(pageNumber, filters);
                          }}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={page >= pages}
                    onClick={() => {
                      setPage(page + 1);
                      fetchVehicles(page + 1, filters);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showAdd && (
        <AddVehicleModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => fetchVehicles()}
        />
      )}

      {showEdit && selected && (
        <EditVehicleModal
          vehicle={selected}
          onClose={() => setShowEdit(false)}
          onSuccess={() => fetchVehicles()}
        />
      )}
    </div>
  );
};

export default AdminVehicles;

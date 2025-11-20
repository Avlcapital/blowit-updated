import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import AddVehicleModal from "../../components/Admin/AddVehicleModal";
import EditVehicleModal from "../../components/Admin/EditVehicleModal";
import api from "../../utils/api";
import "../../styles/admin/AdminVehicles.css";
import { FaPlus, FaSyncAlt, FaFileExport, FaFileImport, FaEdit, FaTrash } from "react-icons/fa";
import { BASE_URL } from "../../utils/config";

const AdminVehicles = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    year: "",
    status: "",
    q: ""
  });

  const csvInputRef = useRef(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchVehicles = async (p = page, f = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: p, limit: 20, ...f });
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
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = () => fetchVehicles(1, filters);

  const resetFilters = () => {
    const f = { brand: "", model: "", year: "", status: "", q: "" };
    setFilters(f);
    fetchVehicles(1, f);
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

    const fd = new FormData();
    fd.append("file", file);

    try {
      await api.post(`${BASE_URL}/api/vehicles/import/csv`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("CSV imported");
      fetchVehicles();
    } catch (err) {
      alert("CSV import failed");
    } finally {
      e.target.value = "";
    }
  };

  const syncBeForward = async () => {
    try {
      const res = await api.post(`${BASE_URL}/api/vehicles/import/beforward`);
      alert(res.data.message || "Sync queued");
    } catch {
      alert("Failed to queue sync");
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />

        <div className="admin-content">

          {/* Header */}
          <div className="vehicles-header">
            <h2>Vehicles</h2>

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

              <button className="btn import" onClick={syncBeForward}>
                <FaSyncAlt /> Sync Be Forward
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="vehicle-filters">
            <input
              name="q"
              placeholder="Search title/model..."
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

          {/* TABLE */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-wrap">
              <table className="vehicle-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Specs</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Media</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v._id}>
  {/* Thumbnail */}
  <td>
    <img
      src={v.images?.[0]?.url || "/placeholder-car.jpg"}
      alt=""
      className="tbl-thumb"
    />
  </td>

  {/* Title (ONLY title now) */}
  <td>
    <strong>{v.title}</strong>
  </td>

  {/* FULL SPECS COLUMN */}
  <td className="specs-cell">

    {/* BRAND | MODEL | STOCK */}
    <div className="spec-line"><strong>Brand:</strong> {v.brand}</div>
    <div className="spec-line"><strong>Model:</strong> {v.model}</div>
    <div className="spec-line"><strong>Stock:</strong> {v.stockNumber || "N/A"}</div>

    {/* LOCATION & CONDITION */}
    <div className="spec-line"><strong>Location:</strong> {v.location || "Japan"}</div>
    <div className="spec-line"><strong>Condition:</strong> {v.condition}</div>

    {/* MAIN VEHICLE INFO */}
    <div className="spec-line"><strong>Year:</strong> {v.year}</div>
    <div className="spec-line"><strong>Mileage:</strong> {v.mileage?.toLocaleString()} km</div>
    <div className="spec-line"><strong>Engine:</strong> {v.engineCapacity || "N/A"}</div>
    <div className="spec-line"><strong>Fuel:</strong> {v.fuelType}</div>
    <div className="spec-line"><strong>Trans:</strong> {v.transmission}</div>
    <div className="spec-line"><strong>Drive:</strong> {v.driveType || "2WD"}</div>
    <div className="spec-line"><strong>Seats:</strong> {v.seats || "N/A"}</div>

  </td>

  {/* Price ONLY */}
  <td>
    <strong>KES {Number(v.price || 0).toLocaleString()}</strong>
  </td>

  {/* Status */}
  <td>
    <span className={`status ${v.status?.toLowerCase()}`}>{v.status}</span>
  </td>

  {/* Media */}
  <td>
    <div className="media-flags">

      {v.auctionSheetUrl ? (
        <span className="flag green">AS</span>
      ) : (
        <span className="flag grey">AS</span>
      )}

      {v.spinImages?.length > 0 ? (
        <span className="flag blue">360°</span>
      ) : (
        <span className="flag grey">360°</span>
      )}

      <div className="tech-icons">
        {v.bluetooth && <span className="ti">BT</span>}
        {v.navigation && <span className="ti">NAV</span>}
        {v.reverseCamera && <span className="ti">CAM</span>}
        {v.hasScreen && <span className="ti">SCR</span>}
      </div>

    </div>
  </td>

  {/* Actions */}
  <td className="row-actions">
    <button
      className="edit-btn"
      onClick={() => {
        setSelected(v);
        setShowEdit(true);
      }}
    >
      <FaEdit />
    </button>

    <button
      className="delete-btn"
      onClick={() => deleteVehicle(v._id)}
    >
      <FaTrash />
    </button>
  </td>
</tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
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
                <span>{page} / {pages}</span>
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

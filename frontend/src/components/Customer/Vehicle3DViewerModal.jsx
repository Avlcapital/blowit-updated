import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import React360Viewer from "react-360-view";
import "@google/model-viewer";
import "../../styles/customer/Vehicle3DViewerModal.css";

const Vehicle3DViewerModal = ({ vehicle, onClose }) => {
  const [mode, setMode] = useState(
    vehicle.has360 ? "360" : vehicle.model3dUrl ? "3d" : "360"
  );

  const has360 = vehicle.has360 && vehicle.spinImages?.length > 0;
  const has3D = !!vehicle.model3dUrl;

  return (
    <div className="v3d-overlay">
      <div className="v3d-modal">
        <button className="v3d-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="v3d-header">
          <h2>3D / 360° View — {vehicle.title || `${vehicle.brand} ${vehicle.model}`}</h2>
        </div>

        <div className="v3d-tabs">
          {has360 && (
            <button
              className={mode === "360" ? "active" : ""}
              onClick={() => setMode("360")}
            >
              360° Image Spin
            </button>
          )}
          {has3D && (
            <button
              className={mode === "3d" ? "active" : ""}
              onClick={() => setMode("3d")}
            >
              3D Model
            </button>
          )}
        </div>

        <div className="v3d-body">
          {mode === "360" && has360 && (
            <React360Viewer
              amount={vehicle.spinImages.length}
              images={vehicle.spinImages}
              autoplay
              loop
            />
          )}

          {mode === "3d" && has3D && (
            <model-viewer
              src={vehicle.model3dUrl}
              alt="3D car"
              auto-rotate
              camera-controls
              shadow-intensity="1"
              style={{ width: "100%", height: "100%" }}
            ></model-viewer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vehicle3DViewerModal;

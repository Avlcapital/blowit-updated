import React, { useEffect, useState } from "react";
import CustomerLayout from "../../components/Customer/CustomerLayout";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/customer/CustomerFavourites.css";
import { FaTrash, FaEye } from "react-icons/fa";

const CustomerFavourites = () => {
  const [favourites, setFavourites] = useState([]);

  const loadFavourites = async () => {
    const res = await api.get(`${BASE_URL}/api/wishlist`);
    if (res.data.success) setFavourites(res.data.favourites);
  };

  const removeFav = async (id) => {
    await api.delete(`${BASE_URL}/api/wishlist/${id}`);
    loadFavourites();
  };

  useEffect(() => {
    loadFavourites();
  }, []);

  return (
    <CustomerLayout>
      <h1>My Favourites ❤️</h1>

      <div className="fav-grid">
        {favourites.length === 0 ? (
          <p>You have no saved vehicles yet.</p>
        ) : (
          favourites.map((v) => (
            <div className="fav-card" key={v._id}>
              <img src={v.images?.[0]?.url || "/placeholder-car.jpg"} alt="" />

              <h3>{v.title || v.brand + " " + v.model}</h3>

              <p>KES {Number(v.price).toLocaleString()}</p>

              <div className="fav-actions">
                <button onClick={() => removeFav(v._id)}><FaTrash /></button>
                <button><FaEye /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerFavourites;

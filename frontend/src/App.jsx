import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import AdminRoute from './components/Routes/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import CustomerRoute from './components/Routes/CustomerRoute'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerVehicles from './pages/customer/CustomerVehicles'
import CustomerFavourites from './pages/customer/CustomerFavourites'
import CustomerVehicleDetails from './pages/customer/CustomerVehicleDetails'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/how-it-works' element={<HowItWorks/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>

        <Route
          path='/admin/dashboard'
          element={
            <AdminRoute>
              <AdminDashboard/>
            </AdminRoute>
          }
        />

        {/*Add this for vehicles management */}
        <Route
          path="/admin/vehicles"
          element={
            <AdminRoute>
              <AdminVehicles />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
           <AdminRoute>
             <AdminUsers />
           </AdminRoute>
          }
        />
        
        <Route
          path="/customer/dashboard"
          element={
           <CustomerRoute>
             <CustomerDashboard />
           </CustomerRoute>
          }
        />

        <Route
          path="/customer/vehicles"
          element={
           <CustomerRoute>
             <CustomerVehicles />
           </CustomerRoute>
          }
        />

        <Route
          path="/customer/favorites"
          element={
           <CustomerRoute>
             <CustomerFavourites />
           </CustomerRoute>
          }
        />

        <Route path="/customer/vehicle/:id" element={<CustomerVehicleDetails />} />


      </Routes>
    </>
  )
}

export default App

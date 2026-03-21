import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import PendingApproval from "./pages/PendingApproval";

import TechLayout from "./layouts/TechLayout";
import TechDashboard from "./pages/tech/Dashboard";
import TechProducts from "./pages/tech/Products";
import TechCart from "./pages/tech/Cart";
import TechCheckout from "./pages/tech/Checkout";
import MyOrders from "./pages/tech/MyOrders";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserApprovals from "./pages/admin/UserApprovals";
import PaymentVerification from "./pages/admin/PaymentVerification";
import ProductManagement from "./pages/admin/ProductManagement";
import AllOrders from "./pages/admin/AllOrders";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-success" element={<RegisterSuccess />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              <Route path="/tech" element={<ProtectedRoute role="TECHNICIAN"><TechLayout /></ProtectedRoute>}>
                <Route index element={<TechDashboard />} />
                <Route path="products" element={<TechProducts />} />
                <Route path="cart" element={<TechCart />} />
                <Route path="checkout" element={<TechCheckout />} />
                <Route path="orders" element={<MyOrders />} />
              </Route>

              <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserApprovals />} />
                <Route path="payments" element={<PaymentVerification />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="orders" element={<AllOrders />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

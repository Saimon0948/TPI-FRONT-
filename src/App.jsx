import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import { CartProvider } from './modules/shared/context/CartContext';
import LoginPage from './modules/auth/pages/LoginPage';
import Dashboard from './modules/templates/components/Dashboard';
import ProtectedRoute from './modules/auth/components/ProtectedRoute';
import ListOrdersPage from './modules/orders/pages/ListOrdersPage';
import Home from './modules/home/pages/Home';
import ListProductsPage from './modules/products/pages/ListProductsPage';
import CreateProductPage from './modules/products/pages/CreateProductPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import CartPage from './modules/customer/pages/CartPage';
import CustomerLayout from './modules/templates/components/CustomerLayout';
import ProductList from './modules/customer/components/ProductList';
function App() {
  const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      {
        index: true, // ruta '/'
        element: <ProductList />,
      },
      {
        path: 'cart',
        element: <CartPage/>, 
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <RegisterPage/>, 
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/admin/home',
        element: <Home />,
      },
      {
        path: '/admin/products',
        element: <ListProductsPage />,
      },
      {
        path: '/admin/products/create',
        element: <CreateProductPage />,
      },
      {
        path: '/admin/orders',
        element: <ListOrdersPage />,
      },
    ],
  },
]);

  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
